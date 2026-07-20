import logging
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
from PIL import Image

logger = logging.getLogger(__name__)

_model_instance = None

class MLEngine:
    def __init__(self):
        self.model = None

    def load_model(self, progress_callback=None):
        global _model_instance
        if _model_instance is not None:
            self.model = _model_instance
            return
        if progress_callback:
            progress_callback(50, "Loading AI Model (clip-ViT-B-32)...")
        logger.info("Loading CLIP model clip-ViT-B-32")
        _model_instance = SentenceTransformer('clip-ViT-B-32')
        self.model = _model_instance

    def cluster_scenes(self, scenes_data, eps=0.5, min_samples=2, progress_callback=None):
        if self.model is None:
            self.load_model(progress_callback)

        if not scenes_data:
            return []

        if progress_callback:
            progress_callback(70, "Computing embeddings...")

        chunk_size = 32
        all_embeddings = []

        for i in range(0, len(scenes_data), chunk_size):
            chunk = scenes_data[i : i + chunk_size]
            chunk_images = [Image.open(scene['frame_path']) for scene in chunk]
            chunk_embeddings = self.model.encode(chunk_images, batch_size=8, show_progress_bar=False)
            all_embeddings.append(chunk_embeddings)

        embeddings = np.vstack(all_embeddings)

        if progress_callback:
            progress_callback(90, "Clustering scenes...")

        scaler = StandardScaler()
        scaled_embeddings = scaler.fit_transform(embeddings)

        logger.info(f"Clustering {len(scenes_data)} scenes with DBSCAN(eps={eps}, min_samples={min_samples})")
        dbscan = DBSCAN(eps=eps, min_samples=min_samples, metric='euclidean')
        clusters = dbscan.fit_predict(scaled_embeddings)

        for i, scene in enumerate(scenes_data):
            scene['cluster'] = int(clusters[i])

        if progress_callback:
            progress_callback(100, "Analysis complete!")

        return scenes_data
