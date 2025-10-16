class ModalityAdapter:
    def preprocess(self, raw_input):
        """Normalize or clean raw multimodal input (e.g. image bytes, audio stream)."""
        raise NotImplementedError

    def embed(self, processed_input):
        """Convert preprocessed input into embedding space."""
        raise NotImplementedError

class VisionAdapter(ModalityAdapter):
    def preprocess(self, image_bytes):
        # e.g. decode, resize, normalize
        return processed_image

    def embed(self, image_tensor):
        return vision_model.encode(image_tensor)

class AudioAdapter(ModalityAdapter):
    def preprocess(self, audio_stream):
        # e.g. resample, trim, denoise
        return processed_audio

    def embed(self, audio_features):
        return audio_model.encode(audio_features)
