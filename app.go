package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// newCmd creates an exec.Cmd with hidden console window (no cmd popup).
func newCmd(name string, args ...string) *exec.Cmd {
	cmd := exec.Command(name, args...)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: 0x00000008, // DETACHED_PROCESS — no console inheritance, no flash
	}
	return cmd
}

// newCmdContext creates a context-aware exec.Cmd with hidden console window.
func newCmdContext(ctx context.Context, name string, args ...string) *exec.Cmd {
	cmd := exec.CommandContext(ctx, name, args...)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: 0x00000008, // DETACHED_PROCESS
	}
	return cmd
}

type App struct {
	ctx        context.Context
	server     *http.Server
	serverMu   sync.Mutex
	serverPort int
	videoPath  string
	thumbDir   string
	clipDir    string
}

type ProgressPayload struct {
	Pct   int    `json:"pct"`
	Stage string `json:"stage"`
}

func (a *App) emitProgress(pct int, stage string) {
	runtime.EventsEmit(a.ctx, "import-progress", ProgressPayload{Pct: pct, Stage: stage})
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	// Start persistent media server once — AMVerge-style instant local streaming
	if err := a.startMediaServer(); err != nil {
		fmt.Println("media server failed:", err)
	}
}

func (a *App) shutdown(ctx context.Context) {
	a.serverMu.Lock()
	defer a.serverMu.Unlock()
	if a.server != nil {
		a.server.Close()
		a.server = nil
	}
	if a.thumbDir != "" {
		os.RemoveAll(a.thumbDir)
	}
	if a.clipDir != "" {
		os.RemoveAll(a.clipDir)
	}
}

// startMediaServer runs a single localhost HTTP server for video + thumbnail streaming.
// Range support via http.ServeContent — browsers seek without loading the full file.
func (a *App) startMediaServer() error {
	a.serverMu.Lock()
	defer a.serverMu.Unlock()
	if a.server != nil {
		return nil
	}

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return err
	}
	a.serverPort = listener.Addr().(*net.TCPAddr).Port

	mux := http.NewServeMux()
	mux.HandleFunc("/video", a.handleVideo)
	mux.HandleFunc("/thumb/", a.handleThumb)
	mux.HandleFunc("/clip/", a.handleClip)

	a.server = &http.Server{Handler: mux}
	go a.server.Serve(listener)
	return nil
}

func (a *App) cors(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Range")
	w.Header().Set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
	w.Header().Set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges")
}

func (a *App) handleVideo(w http.ResponseWriter, r *http.Request) {
	a.cors(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	a.serverMu.Lock()
	path := a.videoPath
	a.serverMu.Unlock()

	if path == "" {
		http.Error(w, "no video loaded", http.StatusNotFound)
		return
	}

	f, err := os.Open(path)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	defer f.Close()

	stat, err := f.Stat()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	ext := strings.ToLower(filepath.Ext(path))
	mimeType := "video/mp4"
	switch ext {
	case ".mkv":
		mimeType = "video/x-matroska"
	case ".mov":
		mimeType = "video/quicktime"
	case ".avi":
		mimeType = "video/x-msvideo"
	case ".webm":
		mimeType = "video/webm"
	case ".m4v":
		mimeType = "video/mp4"
	}
	w.Header().Set("Content-Type", mimeType)
	// ServeContent handles Range requests correctly — critical for big-file seeking
	http.ServeContent(w, r, filepath.Base(path), stat.ModTime(), f)
}

func (a *App) handleThumb(w http.ResponseWriter, r *http.Request) {
	a.cors(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	a.serverMu.Lock()
	dir := a.thumbDir
	a.serverMu.Unlock()
	if dir == "" {
		http.Error(w, "no thumbs", http.StatusNotFound)
		return
	}

	name := filepath.Base(strings.TrimPrefix(r.URL.Path, "/thumb/"))
	if name == "" || name == "." || strings.Contains(name, "..") {
		http.Error(w, "bad path", http.StatusBadRequest)
		return
	}
	full := filepath.Join(dir, name)
	f, err := os.Open(full)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	defer f.Close()
	stat, _ := f.Stat()
	w.Header().Set("Content-Type", "image/jpeg")
	w.Header().Set("Cache-Control", "public, max-age=3600")
	http.ServeContent(w, r, name, stat.ModTime(), f)
}

func (a *App) handleClip(w http.ResponseWriter, r *http.Request) {
	a.cors(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	a.serverMu.Lock()
	dir := a.clipDir
	a.serverMu.Unlock()
	if dir == "" {
		http.Error(w, "no clips", http.StatusNotFound)
		return
	}

	name := filepath.Base(strings.TrimPrefix(r.URL.Path, "/clip/"))
	if name == "" || name == "." || strings.Contains(name, "..") {
		http.Error(w, "bad path", http.StatusBadRequest)
		return
	}
	full := filepath.Join(dir, name)
	f, err := os.Open(full)
	if err != nil {
		http.Error(w, "not found", http.StatusNotFound)
		return
	}
	defer f.Close()
	stat, _ := f.Stat()
	w.Header().Set("Content-Type", "video/mp4")
	w.Header().Set("Cache-Control", "public, max-age=3600")
	http.ServeContent(w, r, name, stat.ModTime(), f)
}

type ExportRecord struct {
	VideoName   string   `json:"videoName"`
	OutputPath  string   `json:"outputPath"`
	ClipCount   int      `json:"clipCount"`
	TimeOffsets []int    `json:"timeOffsets"`
	Date        string   `json:"date"`
	Status      string   `json:"status"`
	Duration    string   `json:"duration"` // human-readable
}

func (a *App) SelectVideo() (string, error) {
	path, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select a Video File",
		Filters: []runtime.FileFilter{
			{DisplayName: "Videos", Pattern: "*.mp4;*.mkv;*.mov;*.avi"},
		},
	})
	if err != nil {
		return "", err
	}
	return path, nil
}

// ServeVideo points the media server at path and returns a stream URL.
// Instant for any size — only bytes requested by the player are read (Range).
func (a *App) ServeVideo(path string) (string, error) {
	if path == "" {
		return "", fmt.Errorf("no video path")
	}
	if _, err := os.Stat(path); err != nil {
		return "", fmt.Errorf("video file not found: %s", path)
	}
	if err := a.startMediaServer(); err != nil {
		return "", err
	}

	a.serverMu.Lock()
	a.videoPath = path
	port := a.serverPort
	// wipe old thumbs on new import
	if a.thumbDir != "" {
		os.RemoveAll(a.thumbDir)
		a.thumbDir = ""
	}
	a.serverMu.Unlock()

	// cache-bust so <video> reloads immediately on reimport
	return fmt.Sprintf("http://127.0.0.1:%d/video?t=%d", port, time.Now().UnixNano()), nil
}

// GenerateThumbnails extracts small JPEG thumbs at each offset (AMVerge-style).
// Grid tiles use these instead of loading the full video N times.
// Returns JSON: [{timeOffset:int, url:string}, ...]
func (a *App) GenerateThumbnails(videoPath string, timeOffsets []int) (string, error) {
	if videoPath == "" {
		return "[]", fmt.Errorf("no video path")
	}
	if err := a.startMediaServer(); err != nil {
		return "[]", err
	}

	dir, err := os.MkdirTemp("", "fracture-thumbs-*")
	if err != nil {
		return "[]", err
	}

	a.serverMu.Lock()
	if a.thumbDir != "" {
		os.RemoveAll(a.thumbDir)
	}
	a.thumbDir = dir
	port := a.serverPort
	a.serverMu.Unlock()

	type thumbItem struct {
		TimeOffset int    `json:"timeOffset"`
		URL        string `json:"url"`
	}

	a.emitProgress(40, "Generating thumbnails...")
	// Cap concurrency so we don't spawn 100 ffmpeg processes
	sem := make(chan struct{}, 4)
	var wg sync.WaitGroup
	var mu sync.Mutex
	results := make([]thumbItem, 0, len(timeOffsets))
	total := len(timeOffsets)
	var completed int

	if total == 0 {
		a.emitProgress(100, "Ready")
		return "[]", nil
	}

	for _, off := range timeOffsets {
		off := off
		if off < 0 {
			off = 0
		}
		wg.Add(1)
		go func() {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			name := fmt.Sprintf("t_%d.jpg", off)
			outPath := filepath.Join(dir, name)
			// -ss before -i = fast keyframe seek; small scale for grid
			cmd := newCmd(findFFmpeg(),
				"-hide_banner", "-loglevel", "error",
				"-ss", strconv.Itoa(off),
				"-i", videoPath,
				"-frames:v", "1",
				"-vf", "scale=320:-2",
				"-q:v", "5",
				"-y", outPath,
			)
			if err := cmd.Run(); err != nil {
				return
			}
			if st, err := os.Stat(outPath); err != nil || st.Size() == 0 {
				return
			}
			mu.Lock()
			results = append(results, thumbItem{
				TimeOffset: off,
				URL:        fmt.Sprintf("http://127.0.0.1:%d/thumb/%s", port, name),
			})
			completed++
			n := completed
			pct := 40 + (n * 55 / total)
			mu.Unlock()
			a.emitProgress(pct, fmt.Sprintf("Thumbnail %d of %d", n, total))
		}()
	}
	wg.Wait()
	a.emitProgress(100, "Ready")

	sort.Slice(results, func(i, j int) bool {
		return results[i].TimeOffset < results[j].TimeOffset
	})
	data, _ := json.Marshal(results)
	return string(data), nil
}

func (a *App) SelectSavePath(defaultName string) (string, error) {
	path, err := runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		Title:           "Save Exported Video As",
		DefaultFilename: defaultName,
		Filters: []runtime.FileFilter{
			{DisplayName: "MP4 Video", Pattern: "*.mp4"},
		},
	})
	if err != nil {
		return "", err
	}
	if path == "" {
		return "", nil // user cancelled
	}
	return path, nil
}

// GetSceneClusters finds cut points via keyframe packet timestamps, splits the
// video into individual scene .mp4 files (AMVerge-style), and returns the scene list.
// Returns JSON: [{timeOffset:int, clusterNum:string, clipUrl:string, ...}]
func (a *App) GetSceneClusters(videoPath string) (string, error) {
	if videoPath == "" {
		return "[]", fmt.Errorf("no video path")
	}

	if err := a.startMediaServer(); err != nil {
		return "[]", err
	}

	a.emitProgress(10, "Scanning keyframes...")
	duration := probeDuration(videoPath)
	times := probeKeyframeTimes(videoPath)

	if len(times) < 2 {
		times = evenSampleTimes(duration, 2.0)
	}
	if len(times) == 0 || times[0] > 0.15 {
		times = append([]float64{0}, times...)
	}
	times = mergeMinGap(times, 0.75)

	const maxScenes = 64
	if len(times) > maxScenes {
		times = thinTimes(times, maxScenes)
	}

	// ── Semantic analysis: extract frame colours + detect black/white ──
	a.emitProgress(20, "Analysing frame colours...")
	type frameColor struct {
		r, g, b    float64
		isNoise    bool
		noiseLabel string
	}
	frameColors := make([]frameColor, len(times))
	cleanIdx := make([]int, 0)
	for i, t := range times {
		offset := int(t + 0.5)
		if t < 0 {
			offset = 0
		}
		r, g, b, err := getFrameColor(videoPath, offset)
		if err != nil {
			r, g, b = 128, 128, 128
		}
		fc := frameColor{r: r, g: g, b: b}
		if bw, why := isBlackOrWhite(r, g, b); bw {
			fc.isNoise = true
			fc.noiseLabel = why
		} else {
			cleanIdx = append(cleanIdx, i)
		}
		frameColors[i] = fc
	}

	// ── DBSCAN clustering on clean frames ──
	a.emitProgress(25, "Clustering scenes by colour similarity...")
	clusterLabels := make([]int, len(times))
	for i := range clusterLabels {
		clusterLabels[i] = -1
	}

	if len(cleanIdx) >= 3 {
		points := make([][]float64, len(cleanIdx))
		for j, idx := range cleanIdx {
			points[j] = []float64{frameColors[idx].r, frameColors[idx].g, frameColors[idx].b}
		}
		labels := dbscanLabels(points, 45.0, 2)
		for j, idx := range cleanIdx {
			clusterLabels[idx] = labels[j]
		}
	}

	// ── Split video at cut points ──
	a.emitProgress(30, "Splitting scenes...")

	// Cut points: skip first (0.0), use remaining as scene boundaries
	cutPoints := times[1:]

	// Create clip temp dir and clean old one
	clipDir, err := os.MkdirTemp("", "fracture-clips-*")
	if err != nil {
		return "[]", err
	}

	a.serverMu.Lock()
	if a.clipDir != "" {
		os.RemoveAll(a.clipDir)
	}
	a.clipDir = clipDir
	port := a.serverPort
	a.serverMu.Unlock()

	// ffmpeg segment muxer - split into individual scene files
	fileBase := strings.TrimSuffix(filepath.Base(videoPath), filepath.Ext(videoPath))
	segFileBase := strings.ReplaceAll(fileBase, "%", "%%")
	outputPattern := filepath.Join(clipDir, segFileBase+"_%04d.mp4")

	segmentArgs := []string{
		"-y",
		"-i", videoPath,
		"-map", "0:v:0",
		"-map", "0:a?",
		"-c:v", "copy",
		"-c:a", "aac",
		"-b:a", "160k",
		"-ac", "2",
		"-ar", "48000",
		"-f", "segment",
	}
	if len(cutPoints) > 0 {
		cutStrs := make([]string, len(cutPoints))
		for i, c := range cutPoints {
			cutStrs[i] = strconv.FormatFloat(c, 'f', 6, 64)
		}
		segmentArgs = append(segmentArgs, "-segment_times", strings.Join(cutStrs, ","))
	}
	segmentArgs = append(segmentArgs, "-reset_timestamps", "1", outputPattern)

	cmd := newCmd(findFFmpeg(), segmentArgs...)
	if out, err := cmd.CombinedOutput(); err != nil {
		return "[]", fmt.Errorf("ffmpeg segment failed: %s: %s", err, string(out))
	}

	a.emitProgress(50, "Collecting scenes...")

	// Collect created scene files
	type sceneResult struct {
		TimeOffset int    `json:"timeOffset"`
		ClusterNum string `json:"clusterNum"`
		ClipURL    string `json:"clipUrl"`
	}
	scenes := make([]sceneResult, 0, len(times))

	for i, startTime := range times {
		sceneFile := filepath.Join(clipDir, fmt.Sprintf(fileBase+"_%04d.mp4", i))
		if _, err := os.Stat(sceneFile); err == nil {
			cn := "0"
			fc := frameColors[i]
			if fc.isNoise {
				cn = "Noise" // black or white frame
			} else if clusterLabels[i] > 0 {
				cn = strconv.Itoa(clusterLabels[i]) // DBSCAN cluster ID
			} else {
				cn = "Noise" // DBSCAN labelled as noise
			}
			scenes = append(scenes, sceneResult{
				TimeOffset: int(startTime + 0.5),
				ClusterNum: cn,
				ClipURL:    fmt.Sprintf("http://127.0.0.1:%d/clip/%s_%04d.mp4", port, fileBase, i),
			})
		}
	}

	if len(scenes) == 0 {
		scenes = []sceneResult{{TimeOffset: 0, ClusterNum: "0", ClipURL: ""}}
	}

	data, _ := json.Marshal(scenes)
	return string(data), nil
}

// probeDuration returns seconds via ffprobe (fast, no decode).
func probeDuration(videoPath string) float64 {
	cmd := newCmd(findFFprobe(),
		"-v", "error",
		"-show_entries", "format=duration",
		"-of", "default=noprint_wrappers=1:nokey=1",
		videoPath,
	)
	out, err := cmd.Output()
	if err != nil {
		return 0
	}
	var d float64
	fmt.Sscanf(strings.TrimSpace(string(out)), "%f", &d)
	if d < 0 || d != d { // NaN
		return 0
	}
	return d
}

// probeKeyframeTimes reads packet flags only — no video decode (AMVerge packet path).
func probeKeyframeTimes(videoPath string) []float64 {
	cmd := newCmd(findFFprobe(),
		"-v", "error",
		"-select_streams", "v:0",
		"-show_entries", "packet=pts_time,flags",
		"-of", "csv=p=0",
		videoPath,
	)
	out, err := cmd.Output()
	if err != nil {
		return nil
	}

	var times []float64
	seen := make(map[int]bool) // de-dupe to 0.1s buckets
	for _, line := range strings.Split(string(out), "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		// csv: pts_time,flags  e.g. 12.345000,K__
		parts := strings.Split(line, ",")
		if len(parts) < 2 {
			continue
		}
		flags := parts[1]
		if !strings.Contains(flags, "K") {
			continue
		}
		var t float64
		if _, err := fmt.Sscanf(parts[0], "%f", &t); err != nil {
			continue
		}
		if t < 0 {
			continue
		}
		bucket := int(t * 10)
		if seen[bucket] {
			continue
		}
		seen[bucket] = true
		times = append(times, t)
	}
	sort.Float64s(times)
	return times
}

func evenSampleTimes(duration, step float64) []float64 {
	if step <= 0 {
		step = 2
	}
	if duration <= 0 {
		// unknown length — first ~2 minutes
		duration = 120
	}
	var times []float64
	for t := 0.0; t < duration; t += step {
		times = append(times, t)
	}
	return times
}

func mergeMinGap(times []float64, minGap float64) []float64 {
	if len(times) == 0 {
		return times
	}
	sort.Float64s(times)
	out := []float64{times[0]}
	for _, t := range times[1:] {
		if t-out[len(out)-1] >= minGap {
			out = append(out, t)
		}
	}
	return out
}

func thinTimes(times []float64, maxN int) []float64 {
	if len(times) <= maxN {
		return times
	}
	out := make([]float64, 0, maxN)
	for i := 0; i < maxN; i++ {
		idx := i * (len(times) - 1) / (maxN - 1)
		out = append(out, times[idx])
	}
	return out
}

// parsePtsTimes extracts pts_time values from ffmpeg showinfo output
func parsePtsTimes(output string) []float64 {
	var times []float64
	seen := make(map[float64]bool)
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		if strings.Contains(line, "pts_time:") {
			parts := strings.Split(line, "pts_time:")
			if len(parts) == 2 {
				trimmed := strings.TrimSpace(strings.Split(parts[1], " ")[0])
				var t float64
				if _, err := fmt.Sscanf(trimmed, "%f", &t); err == nil {
					if !seen[t] {
						times = append(times, t)
						seen[t] = true
					}
				}
			}
		}
	}
	return times
}

// parseBrightness extracts the average Y (luma) value from signalstats output
func parseBrightness(output string) float64 {
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		if strings.Contains(line, "YMIN") && strings.Contains(line, "YAVG") {
			// Parse YAVG value from line like: [signalstats ...] YMIN=10 YLOW=20 YAVG=128 YHIGH=230 YMAX=245
			parts := strings.Fields(line)
			for _, p := range parts {
				if strings.HasPrefix(p, "YAVG=") {
					val := strings.TrimPrefix(p, "YAVG=")
					var avg float64
					fmt.Sscanf(val, "%f", &avg)
					return avg
				}
			}
		}
	}
	return 128 // neutral default
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

// getFrameColor extracts average R/G/B from a single frame via 1×1 ffmpeg pixel.
func getFrameColor(videoPath string, timeSec int) (float64, float64, float64, error) {
	cmd := newCmd(findFFmpeg(),
		"-hide_banner", "-loglevel", "error",
		"-ss", strconv.Itoa(timeSec),
		"-i", videoPath,
		"-frames:v", "1",
		"-vf", "scale=1:1",
		"-f", "rawvideo", "-pix_fmt", "rgb24",
		"-",
	)
	out, err := cmd.Output()
	if err != nil || len(out) < 3 {
		return 128, 128, 128, fmt.Errorf("no pixel data")
	}
	r := float64(out[0])
	g := float64(out[1])
	b := float64(out[2])
	return r, g, b, nil
}

func isBlackOrWhite(r, g, b float64) (bool, string) {
	if r < 25 && g < 25 && b < 25 {
		return true, "black"
	}
	if r > 230 && g > 230 && b > 230 {
		return true, "white"
	}
	return false, ""
}

// dbscanLabels runs DBSCAN on a 3D float64 slice. eps=radius, minPts=neighbour threshold.
// Returns cluster labels (-1 = noise).
func dbscanLabels(points [][]float64, eps float64, minPts int) []int {
	n := len(points)
	labels := make([]int, n)
	for i := range labels {
		labels[i] = -1 // unvisited
	}

	euclid := func(a, b []float64) float64 {
		var s float64
		for i := 0; i < len(a); i++ {
			d := a[i] - b[i]
			s += d * d
		}
		return s // squared distance (compare against eps²)
	}

	eps2 := eps * eps
	var findNeighbours func(idx int) []int
	findNeighbours = func(idx int) []int {
		var nb []int
		for j := 0; j < n; j++ {
			if euclid(points[idx], points[j]) <= eps2 {
				nb = append(nb, j)
			}
		}
		return nb
	}

	clusterID := 0
	for i := 0; i < n; i++ {
		if labels[i] >= 0 {
			continue
		}
		neighbours := findNeighbours(i)
		if len(neighbours) < minPts {
			labels[i] = 0 // noise
			continue
		}
		clusterID++
		labels[i] = clusterID
		seedSet := neighbours
		for _, s := range seedSet {
			if labels[s] == 0 {
				labels[s] = clusterID
				// expand
				nb2 := findNeighbours(s)
				if len(nb2) >= minPts {
					seedSet = append(seedSet, nb2...)
				}
			} else if labels[s] < 0 {
				labels[s] = clusterID
				nb2 := findNeighbours(s)
				if len(nb2) >= minPts {
					seedSet = append(seedSet, nb2...)
				}
			}
		}
	}
	return labels
}

// ExportTimeline builds an MP4 quickly via stream-copy segment extract + concat.
// Soft cuts from merged overlapping ranges; output is always .mp4.
func (a *App) ExportTimeline(videoPath string, timeOffsets []int, outputPath string) (string, error) {
	if videoPath == "" || len(timeOffsets) == 0 || outputPath == "" {
		return "", fmt.Errorf("invalid input")
	}

	// Force MP4 container
	if !strings.HasSuffix(strings.ToLower(outputPath), ".mp4") {
		outputPath = strings.TrimSuffix(outputPath, filepath.Ext(outputPath)) + ".mp4"
	}

	if _, err := os.Stat(outputPath); err == nil {
		os.Remove(outputPath)
	}

	// Sort & merge overlapping 10s windows (gap < 2s → one longer segment)
	sorted := make([]int, len(timeOffsets))
	copy(sorted, timeOffsets)
	sort.Ints(sorted)

	type segment struct{ start, end int }
	var merged []segment
	for _, offset := range sorted {
		start, end := offset, offset+10
		if len(merged) == 0 {
			merged = append(merged, segment{start, end})
			continue
		}
		last := &merged[len(merged)-1]
		if start <= last.end-2 {
			if end > last.end {
				last.end = end
			}
		} else {
			merged = append(merged, segment{start, end})
		}
	}

	workDir, err := os.MkdirTemp("", "fracture_export_*")
	if err != nil {
		return "", err
	}
	defer os.RemoveAll(workDir)

	// Parallel stream-copy extracts (cap 4)
	type jobResult struct {
		idx  int
		file string
		err  error
	}
	sem := make(chan struct{}, 4)
	var wg sync.WaitGroup
	results := make(chan jobResult, len(merged))

	for i, seg := range merged {
		i, seg := i, seg
		wg.Add(1)
		go func() {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			out := filepath.Join(workDir, fmt.Sprintf("clip_%04d.mp4", i))
			// -ss before -i for fast seek; stream copy = no reencode
			cmd := newCmd(findFFmpeg(),
				"-hide_banner", "-loglevel", "error",
				"-y",
				"-ss", strconv.Itoa(seg.start),
				"-t", strconv.Itoa(seg.end-seg.start),
				"-i", videoPath,
				"-c:v", "copy",
				"-c:a", "aac", "-b:a", "192k",
				"-avoid_negative_ts", "make_zero",
				"-movflags", "+faststart",
				out,
			)
			if o, err := cmd.CombinedOutput(); err != nil {
				// Fallback: light reencode if copy fails (codec/container edge cases)
				cmd2 := newCmd(findFFmpeg(),
					"-hide_banner", "-loglevel", "error",
					"-y",
					"-ss", strconv.Itoa(seg.start),
					"-t", strconv.Itoa(seg.end-seg.start),
					"-i", videoPath,
					"-c:v", "libx264", "-preset", "ultrafast", "-crf", "20",
					"-c:a", "aac", "-b:a", "160k",
					"-movflags", "+faststart",
					out,
				)
				if o2, err2 := cmd2.CombinedOutput(); err2 != nil {
					results <- jobResult{i, "", fmt.Errorf("extract %d: %v / %v\n%s\n%s", i, err, err2, o, o2)}
					return
				}
			}
			if st, e := os.Stat(out); e != nil || st.Size() == 0 {
				results <- jobResult{i, "", fmt.Errorf("empty clip %d", i)}
				return
			}
			results <- jobResult{i, out, nil}
		}()
	}
	wg.Wait()
	close(results)

	files := make([]string, len(merged))
	var firstErr error
	got := 0
	for r := range results {
		if r.err != nil {
			if firstErr == nil {
				firstErr = r.err
			}
			continue
		}
		files[r.idx] = r.file
		got++
	}
	if got == 0 {
		if firstErr != nil {
			return "", firstErr
		}
		return "", fmt.Errorf("no clips extracted")
	}

	// Compact non-empty files in order
	var ordered []string
	for _, f := range files {
		if f != "" {
			ordered = append(ordered, f)
		}
	}

	if len(ordered) == 1 {
		cmd := newCmd(findFFmpeg(), "-hide_banner", "-loglevel", "error",
			"-y", "-i", ordered[0], "-c", "copy", "-movflags", "+faststart", outputPath)
		if o, err := cmd.CombinedOutput(); err != nil {
			// plain file copy fallback
			data, rerr := os.ReadFile(ordered[0])
			if rerr != nil {
				return "", fmt.Errorf("finalize failed: %v\n%s", err, o)
			}
			if werr := os.WriteFile(outputPath, data, 0644); werr != nil {
				return "", werr
			}
		}
		return outputPath, nil
	}

	// Concat demuxer — stream copy, instant merge
	listPath := filepath.Join(workDir, "concat.txt")
	var listBody strings.Builder
	for _, f := range ordered {
		// ffmpeg concat requires forward slashes + escaped quotes
		p := strings.ReplaceAll(f, `\`, `/`)
		p = strings.ReplaceAll(p, `'`, `'\''`)
		listBody.WriteString("file '" + p + "'\n")
	}
	if err := os.WriteFile(listPath, []byte(listBody.String()), 0644); err != nil {
		return "", err
	}

	concatCmd := newCmd(findFFmpeg(),
		"-hide_banner", "-loglevel", "error",
		"-y",
		"-f", "concat",
		"-safe", "0",
		"-i", listPath,
		"-c", "copy",
		"-movflags", "+faststart",
		outputPath,
	)
	if o, err := concatCmd.CombinedOutput(); err != nil {
		// One-pass reencode concat fallback (still much faster than old multi-pass)
		args := []string{"-hide_banner", "-loglevel", "error", "-y"}
		for _, f := range ordered {
			args = append(args, "-i", f)
		}
		n := len(ordered)
		var fc strings.Builder
		for i := 0; i < n; i++ {
			fc.WriteString(fmt.Sprintf("[%d:v:0][%d:a:0?]", i, i))
		}
		fc.WriteString(fmt.Sprintf("concat=n=%d:v=1:a=1[outv][outa]", n))
		args = append(args,
			"-filter_complex", fc.String(),
			"-map", "[outv]", "-map", "[outa]",
			"-c:v", "libx264", "-preset", "ultrafast", "-crf", "20",
			"-c:a", "aac", "-b:a", "160k",
			"-movflags", "+faststart",
			outputPath,
		)
		cmd2 := newCmd(findFFmpeg(), args...)
		if o2, err2 := cmd2.CombinedOutput(); err2 != nil {
			return "", fmt.Errorf("concat failed: %v / %v\n%s\n%s", err, err2, o, o2)
		}
	}

	return outputPath, nil
}

// GetHistory returns all export records
func (a *App) GetHistory() (string, error) {
	records, err := loadHistory()
	if err != nil {
		return "[]", nil // return empty array on error
	}
	data, _ := json.Marshal(records)
	return string(data), nil
}

// SaveExportRecord saves an export to history
func (a *App) SaveExportRecord(videoPath string, outputPath string, timeOffsets []int, duration string) (bool, error) {
	records, err := loadHistory()
	if err != nil {
		records = []ExportRecord{}
	}

	record := ExportRecord{
		VideoName:   filepath.Base(videoPath),
		OutputPath:  outputPath,
		ClipCount:   len(timeOffsets),
		TimeOffsets: timeOffsets,
		Date:        time.Now().Format("Jan 2, 2006 15:04"),
		Status:      "COMPLETED",
		Duration:    duration,
	}
	records = append([]ExportRecord{record}, records...)

	data, _ := json.MarshalIndent(records, "", "  ")
	historyPath := getHistoryPath()
	os.MkdirAll(filepath.Dir(historyPath), 0755)
	err = os.WriteFile(historyPath, data, 0644)
	if err != nil {
		return false, err
	}
	return true, nil
}

func getHistoryPath() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, "AppData", "Local", "fracture", "export_history.json")
}

func getConfigDir() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, "AppData", "Local", "fracture")
}

// OpenConfigFolder opens the Fracture local app-data folder in Explorer.
func (a *App) OpenConfigFolder() (string, error) {
	configDir := getConfigDir()
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return "", err
	}

	if err := newCmd("explorer.exe", configDir).Start(); err != nil {
		return "", err
	}

	return configDir, nil
}

func loadHistory() ([]ExportRecord, error) {
	historyPath := getHistoryPath()
	data, err := os.ReadFile(historyPath)
	if err != nil {
		return []ExportRecord{}, nil
	}
	var records []ExportRecord
	err = json.Unmarshal(data, &records)
	if err != nil {
		return []ExportRecord{}, nil
	}
	return records, nil
}

// ── yt-dlp Integration ──

type DownloadProgressPayload struct {
	Pct   int    `json:"pct"`
	Speed string `json:"speed,omitempty"`
	ETA   string `json:"eta,omitempty"`
	Size  string `json:"size,omitempty"`
	Stage string `json:"stage"`
}

func (a *App) emitDownloadProgress(pct int, speed, eta, size, stage string) {
	runtime.EventsEmit(a.ctx, "download-progress", DownloadProgressPayload{
		Pct: pct, Speed: speed, ETA: eta, Size: size, Stage: stage,
	})
}


// findFFmpeg resolves ffmpeg binary: PATH, app install dir, then common paths.
func findFFmpeg() string {
	if p, err := exec.LookPath("ffmpeg"); err == nil {
		return p
	}
	if exe, err := os.Executable(); err == nil {
		dir := filepath.Dir(exe)
		candidate := filepath.Join(dir, "ffmpeg.exe")
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	}
	candidates := []string{
		"C:fmpeginfmpeg.exe",
		filepath.Join(os.Getenv("LOCALAPPDATA"), "Fracture", "ffmpeg.exe"),
	}
	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			return c
		}
	}
	return "ffmpeg"
}

// findFFprobe resolves ffprobe binary using the same strategy as findFFmpeg.
func findFFprobe() string {
	if p, err := exec.LookPath("ffprobe"); err == nil {
		return p
	}
	if exe, err := os.Executable(); err == nil {
		dir := filepath.Dir(exe)
		candidate := filepath.Join(dir, "ffprobe.exe")
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	}
	candidates := []string{
		"C:fmpeginfprobe.exe",
		filepath.Join(os.Getenv("LOCALAPPDATA"), "Fracture", "ffprobe.exe"),
	}
	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			return c
		}
	}
	return "ffprobe"
}
func findYTDLP() string {
	if p, err := exec.LookPath("yt-dlp"); err == nil {
		return p
	}
	// Check app's own directory (where the installer places it)
	if exe, err := os.Executable(); err == nil {
		dir := filepath.Dir(exe)
		candidate := filepath.Join(dir, "yt-dlp.exe")
		if _, err := os.Stat(candidate); err == nil {
			return candidate
		}
	}
	home, _ := os.UserHomeDir()
	candidates := []string{
		filepath.Join(home, "AppData", "Local", "fracture", "bin", "yt-dlp.exe"),
		filepath.Join(home, "AppData", "Local", "Programs", "Python", "Python312", "Scripts", "yt-dlp.exe"),
		filepath.Join(home, "AppData", "Roaming", "npm", "yt-dlp.exe"),
		filepath.Join(os.Getenv("LOCALAPPDATA"), "Fracture", "yt-dlp.exe"),
	}
	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			return c
		}
	}
	return "yt-dlp"
}

type VideoFormat struct {
	ID      string `json:"id"`
	Ext     string `json:"ext"`
	Res     string `json:"res"`
	Size    string `json:"size"`
	Note    string `json:"note"`
	Codec   string `json:"codec"`
	Bitrate string `json:"bitrate,omitempty"`
}

type VideoInfo struct {
	Title   string        `json:"title"`
	URL     string        `json:"url"`
	Formats []VideoFormat `json:"formats"`
}

func (a *App) GetVideoFormats(urlStr string) (string, error) {
	bin := findYTDLP()
	cmd := newCmd(bin, "--no-download", "--dump-single-json", urlStr)
	out, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("yt-dlp failed: %w", err)
	}
	var raw struct {
		Title   string `json:"title"`
		Formats []struct {
			FormatID   string  `json:"format_id"`
			Ext        string  `json:"ext"`
			Resolution string  `json:"resolution"`
			Filesize   int64   `json:"filesize"`
			FormatNote string  `json:"format_note"`
			VCodec     string  `json:"vcodec"`
			ACodec     string  `json:"acodec"`
			TBR        float64 `json:"tbr"`
		} `json:"formats"`
	}
	if err := json.Unmarshal(out, &raw); err != nil {
		return "", fmt.Errorf("parse failed: %w", err)
	}
	info := VideoInfo{Title: raw.Title, URL: urlStr, Formats: make([]VideoFormat, 0)}
	for _, f := range raw.Formats {
		res := f.Resolution
		if res == "" {
			res = "audio only"
		}
		size := ""
		if f.Filesize > 0 {
			size = fmt.Sprintf("%.1f MB", float64(f.Filesize)/1024/1024)
		}
		codec := f.VCodec
		if codec == "none" {
			codec = f.ACodec
		}
		br := ""
		if f.TBR > 0 {
			br = fmt.Sprintf("%.0f kbps", f.TBR)
		}
		note := f.FormatNote
		if note == "" {
			note = codec
		}
		info.Formats = append(info.Formats, VideoFormat{
			ID: f.FormatID, Ext: f.Ext, Res: res, Size: size,
			Note: note, Codec: codec, Bitrate: br,
		})
	}
	sort.Slice(info.Formats, func(i, j int) bool {
		// Parse size strings like "125.3 MB" for comparison
		parseMB := func(s string) float64 {
			if s == "" { return 0 }
			var v float64
			var unit string
			fmt.Sscanf(s, "%f%s", &v, &unit)
			if strings.Contains(unit, "GB") { return v * 1024 }
			return v
		}
		return parseMB(info.Formats[i].Size) > parseMB(info.Formats[j].Size)
	})
	data, _ := json.Marshal(info)
	return string(data), nil
}

func (a *App) DownloadVideo(urlStr, formatID, destType string) (string, error) {
	bin := findYTDLP()
	var saveDir string
	if destType == "import" {
		home, _ := os.UserHomeDir()
		saveDir = filepath.Join(home, "AppData", "Local", "fracture", "media")
		os.MkdirAll(saveDir, 0755)
	} else if destType == "desktop" {
		home, _ := os.UserHomeDir()
		saveDir = filepath.Join(home, "Desktop")
		os.MkdirAll(saveDir, 0755)
	} else {
		// "pick" — open folder picker dialog
		dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
			Title: "Choose download location",
		})
		if err != nil || dir == "" {
			return "", fmt.Errorf("cancelled")
		}
		saveDir = dir
	}
	a.emitDownloadProgress(0, "", "", "", "Starting download...")
	outputTemplate := filepath.Join(saveDir, "%(title)s.%(ext)s")
	args := []string{"--no-playlist", "--no-warnings", "-f", formatID, "-o", outputTemplate, "--newline", urlStr}

	// Context with 15-min timeout so yt-dlp can't hang forever
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Minute)
	defer cancel()

	cmd := newCmdContext(ctx, bin, args...)
	stderr, _ := cmd.StderrPipe()
	stdout, _ := cmd.StdoutPipe()

	// Lenient progress regex: [download]  XX.X% of ~YY.YMiB at ZZ.ZMiB/s ETA 00:00
	progRe := regexp.MustCompile(`\[download\]\s+([\d.]+)%.*?of\s+~?([\d.]+[KMGT]?i?B).*?(?:at\s+([\d.]+[KMGT]?i?B/s).*?ETA\s+(\S+)|in\s+(\S+))`)
	progDone := make(chan struct{})
	go func() {
		defer close(progDone)
		scanner := bufio.NewScanner(io.MultiReader(stderr, stdout))
		scanner.Buffer(make([]byte, 64*1024), 256*1024)
		for scanner.Scan() {
			line := scanner.Text()
			if m := progRe.FindStringSubmatch(line); len(m) > 4 {
				pct, _ := strconv.ParseFloat(m[1], 64)
				speed, eta := "", ""
				if m[3] != "" {
					speed = m[3]
					eta = m[4]
				}
				a.emitDownloadProgress(int(pct), speed, eta, m[2], "Downloading...")
			}
		}
	}()

	if err := cmd.Start(); err != nil {
		<-progDone
		return "", fmt.Errorf("start failed: %w", err)
	}

	if err := cmd.Wait(); err != nil {
		<-progDone
		if ctx.Err() != nil {
			return "", fmt.Errorf("download timed out after 15 minutes")
		}
		return "", fmt.Errorf("download failed: %w", err)
	}
	<-progDone
	a.emitDownloadProgress(100, "", "", "", "Complete")
	var downloaded string
	entries, _ := os.ReadDir(saveDir)
	for _, e := range entries {
		if !e.IsDir() {
			ext := strings.ToLower(filepath.Ext(e.Name()))
			if ext == ".mp4" || ext == ".mkv" || ext == ".webm" {
				fullPath := filepath.Join(saveDir, e.Name())
				if downloaded == "" {
					downloaded = fullPath
				}
			}
		}
	}
	if destType == "import" && downloaded != "" {
		a.serverMu.Lock()
		a.videoPath = downloaded
		a.serverMu.Unlock()
	}
	return downloaded, nil
}