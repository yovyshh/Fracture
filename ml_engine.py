import logging
import threading

import numpy as np
from PIL import Image
from sentence_transformers import SentenceTransformer
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import normalize

logger = logging.getLogger(__name__)

_model_instance = None
_model_lock = threading.Lock()
_model_device = None  # 'cuda' | 'cpu' | 'mps'


def _pick_device():
    global _model_device
    if _model_device is not None:
        return _model_device
    try:
        import torch
        if torch.cuda.is_available():
            _model_device = "cuda"
        elif getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
            _model_device = "mps"
        else:
            _model_device = "cpu"
    except Exception:
        _model_device = "cpu"
    logger.info("ML device: %s", _model_device)
    return _model_device


class MLEngine:
    """CLIP embeddings + cosine DBSCAN. Optimized batch encode + device pin."""

    def __init__(self):
        self.model = None
        self._cached_embeddings = None
        self._cached_scene_ids = None

    @staticmethod
    def is_model_ready():
        return _model_instance is not None

    def load_model(self, progress_callback=None):
        global _model_instance
        if _model_instance is not None:
            self.model = _model_instance
            return

        with _model_lock:
            if _model_instance is not None:
                self.model = _model_instance
                return
            device = _pick_device()
            if progress_callback:
                progress_callback(50, f"Loading CLIP on {device}…")
            logger.info("Loading CLIP clip-ViT-B-32 on %s", device)
            # device arg speeds encode significantly on GPU
            _model_instance = SentenceTransformer("clip-ViT-B-32", device=device)
            self.model = _model_instance

    def clear_cache(self):
        self._cached_embeddings = None
        self._cached_scene_ids = None

    def compute_embeddings(self, scenes_data, progress_callback=None, cancel_event=None):
        if self.model is None:
            self.load_model(progress_callback)

        if not scenes_data:
            self.clear_cache()
            return None

        if progress_callback:
            progress_callback(60, "Computing embeddings…")

        # Load all images first (small 224px JPEGs — cheap)
        images = []
        for scene in scenes_data:
            if cancel_event is not None and cancel_event.is_set():
                return None
            img = Image.open(scene["frame_path"]).convert("RGB")
            # Ensure small; CLIP will resize further but smaller input helps I/O
            if max(img.size) > 256:
                img.thumbnail((256, 256), Image.Resampling.BILINEAR)
            images.append(img)

        device = _pick_device()
        # Larger batches on GPU
        batch_size = 64 if device == "cuda" else (32 if device == "mps" else 16)

        if progress_callback:
            progress_callback(70, f"Encoding {len(images)} frames ({device})…")

        # Single encode call is faster than many small chunks on GPU
        # For very large N, chunk to keep memory bounded
        chunk_size = 256 if device == "cuda" else 128
        all_emb = []
        for i in range(0, len(images), chunk_size):
            if cancel_event is not None and cancel_event.is_set():
                return None
            chunk = images[i: i + chunk_size]
            emb = self.model.encode(
                chunk,
                batch_size=batch_size,
                show_progress_bar=False,
                convert_to_numpy=True,
            )
            all_emb.append(np.asarray(emb, dtype=np.float32))
            if progress_callback:
                done = min(i + chunk_size, len(images))
                pct = 70 + int(done / len(images) * 18)
                progress_callback(pct, f"Embed {done}/{len(images)}")

        for img in images:
            try:
                img.close()
            except Exception:
                pass

        embeddings = np.vstack(all_emb)
        embeddings = normalize(embeddings, norm="l2", axis=1)
        self._cached_embeddings = embeddings
        self._cached_scene_ids = [s["id"] for s in scenes_data]
        return embeddings

    def apply_clustering(self, scenes_data, embeddings=None, eps=0.35, min_samples=2, progress_callback=None):
        if embeddings is None:
            embeddings = self._cached_embeddings
        if embeddings is None or len(scenes_data) == 0:
            return scenes_data

        if progress_callback:
            progress_callback(92, "Clustering…")

        logger.info(
            "DBSCAN n=%d eps=%s min_samples=%s cosine",
            len(scenes_data), eps, min_samples,
        )
        dbscan = DBSCAN(eps=eps, min_samples=min_samples, metric="cosine", n_jobs=-1)
        clusters = dbscan.fit_predict(embeddings)

        for i, scene in enumerate(scenes_data):
            scene["cluster"] = int(clusters[i])

        if progress_callback:
            progress_callback(100, "Done")

        n_clusters = len({c for c in clusters if c >= 0})
        n_noise = int(np.sum(clusters < 0))
        logger.info("clusters=%d noise=%d", n_clusters, n_noise)
        return scenes_data

    def cluster_scenes(self, scenes_data, eps=0.35, min_samples=2, progress_callback=None, cancel_event=None):
        if self.model is None:
            self.load_model(progress_callback)
        if not scenes_data:
            return []
        embeddings = self.compute_embeddings(
            scenes_data, progress_callback=progress_callback, cancel_event=cancel_event
        )
        if embeddings is None:
            return scenes_data
        return self.apply_clustering(
            scenes_data,
            embeddings=embeddings,
            eps=eps,
            min_samples=min_samples,
            progress_callback=progress_callback,
        )

    def recluster_cached(self, scenes_data, eps=0.35, min_samples=2, progress_callback=None):
        if self._cached_embeddings is None:
            raise RuntimeError("No cached embeddings — run a full analysis first.")
        if len(scenes_data) != len(self._cached_embeddings):
            raise RuntimeError("Scene count changed; full re-analysis required.")
        return self.apply_clustering(
            scenes_data,
            embeddings=self._cached_embeddings,
            eps=eps,
            min_samples=min_samples,
            progress_callback=progress_callback,
        )


def preload_model_async(callback=None):
    def _run():
        try:
            eng = MLEngine()
            eng.load_model()
            if callback:
                callback(True, None)
        except Exception as e:
            logger.exception("Model preload failed")
            if callback:
                callback(False, str(e))

    t = threading.Thread(target=_run, name="clip-preload", daemon=True)
    t.start()
    return t
