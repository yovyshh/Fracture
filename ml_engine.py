import os
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans
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

        images = [Image.open(scene['frame_path']) for scene in scenes_data]
        embeddings = self.model.encode(images, batch_size=8, show_progress_bar=False)

        if progress_callback:
            progress_callback(90, "Clustering scenes...")

        n_clusters = min(n_clusters, len(scenes_data))
        if n_clusters <= 1:
            for scene in scenes_data:
                scene['cluster'] = 0
            if progress_callback:
                progress_callback(100, "Analysis complete!")
            return scenes_data
            
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init='auto')
        clusters = kmeans.fit_predict(embeddings)

        for i, scene in enumerate(scenes_data):
            scene['cluster'] = int(clusters[i])

        if progress_callback:
            progress_callback(100, "Analysis complete!")
            
        return scenes_data
