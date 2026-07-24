package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx        context.Context
	server     *http.Server
	serverMu   sync.Mutex
	serverPort int
	videoPath  string
	thumbDir   string
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

	// Cap concurrency so we don't spawn 100 ffmpeg processes
	sem := make(chan struct{}, 4)
	var wg sync.WaitGroup
	var mu sync.Mutex
	results := make([]thumbItem, 0, len(timeOffsets))

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
			cmd := exec.Command("ffmpeg",
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
			mu.Unlock()
		}()
	}
	wg.Wait()

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

// GetSceneClusters finds cut points the AMVerge way: keyframe packet timestamps
// via ffprobe (no full-video decode). Sub-second on most files.
// Returns JSON [{timeOffset:int, clusterNum:string}, ...]
func (a *App) GetSceneClusters(videoPath string) (string, error) {
	if videoPath == "" {
		return "[]", fmt.Errorf("no video path")
	}

	duration := probeDuration(videoPath)
	times := probeKeyframeTimes(videoPath)

	// Fallback: even spacing if keyframe metadata is missing/broken
	if len(times) < 2 {
		times = evenSampleTimes(duration, 2.0)
	}

	// Always include start
	if len(times) == 0 || times[0] > 0.15 {
		times = append([]float64{0}, times...)
	}

	// Merge tiny segments (AMVerge merge_short_scenes)
	times = mergeMinGap(times, 0.75)

	// Cap UI density
	const maxScenes = 64
	if len(times) > maxScenes {
		times = thinTimes(times, maxScenes)
	}

	type clusterItem struct {
		TimeOffset int    `json:"timeOffset"`
		ClusterNum string `json:"clusterNum"`
	}

	// Simple sequential clusters (5 buckets by position) — real CLIP clustering can come later
	result := make([]clusterItem, 0, len(times))
	for i, t := range times {
		if t < 0 {
			t = 0
		}
		if duration > 0 && t >= duration {
			continue
		}
		// Group into ~5 clusters by timeline fifths
		cluster := 0
		if duration > 0 {
			cluster = int((t / duration) * 5)
			if cluster > 4 {
				cluster = 4
			}
		} else {
			cluster = i % 5
		}
		result = append(result, clusterItem{
			TimeOffset: int(t + 0.5),
			ClusterNum: strconv.Itoa(cluster),
		})
	}

	if len(result) == 0 {
		result = []clusterItem{{TimeOffset: 0, ClusterNum: "0"}}
	}

	data, _ := json.Marshal(result)
	return string(data), nil
}

// probeDuration returns seconds via ffprobe (fast, no decode).
func probeDuration(videoPath string) float64 {
	cmd := exec.Command("ffprobe",
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
	cmd := exec.Command("ffprobe",
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
			cmd := exec.Command("ffmpeg",
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
				cmd2 := exec.Command("ffmpeg",
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
		cmd := exec.Command("ffmpeg", "-hide_banner", "-loglevel", "error",
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

	concatCmd := exec.Command("ffmpeg",
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
		cmd2 := exec.Command("ffmpeg", args...)
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