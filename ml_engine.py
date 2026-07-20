import os
from sentence_transformers import SentenceTransformer
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
from PIL import Image

class MLEngine:
    def __init__(self):
        self.model = None

    def load_model(self, progress_callback=None):
        if progress_callback:
            progress_callback(50, "Loading AI Model (clip-ViT-B-32)...")
        # Ensure download lag is handled gracefully (UI handles threading so no freeze)
        self.model = SentenceTransformer('clip-ViT-B-32')

    def cluster_scenes(self, scenes_data, n_clusters=5, progress_callback=None):
        if self.model is None:
            self.load_model(progress_callback)
            
        if not scenes_data:
            return []

        if progress_callback:
            progress_callback(70, "Computing embeddings...")

        # Process images in chunks to manage memory efficiently
        chunk_size = 32
        all_embeddings = []
        
        for i in range(0, len(scenes_data), chunk_size):
            chunk = scenes_data[i : i + chunk_size]
            chunk_images = [Image.open(scene['frame_path']) for scene in chunk]
            chunk_embeddings = self.model.encode(chunk_images, batch_size=8, show_progress_bar=False)
            all_embeddings.append(chunk_embeddings)
            
        import numpy as np
        embeddings = np.vstack(all_embeddings)

        if progress_callback:
            progress_callback(90, "Clustering scenes...")

        # Use DBSCAN for more natural scene clustering (no need to pre-define cluster count)
        # Standardize embeddings for better DBSCAN performance
        scaler = StandardScaler()
        scaled_embeddings = scaler.fit_transform(embeddings)
        
        # eps and min_samples are heuristic defaults; these could be moved to a config file
        dbscan = DBSCAN(eps=0.5, min_samples=2, metric='euclidean')
        clusters = dbscan.fit_predict(scaled_embeddings)

        for i, scene in enumerate(scenes_data):
            scene['cluster'] = int(clusters[i])

        if progress_callback:
            progress_callback(100, "Analysis complete!")
            
        return scenes_data
