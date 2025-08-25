import cv2
import numpy as np
import tensorflow as tf
import os
import time
from datetime import datetime

# --- CONFIG ---
REFERENCE_IMAGE_PATH = '/Users/manassrv29/Desktop/project/expo-project/backend/uploads/current_1.jpg'  # Change as needed
TFLITE_MODEL_PATH = 'output_model.tflite'
CASCADE_PATH = 'haarcascade_frontalface_default.xml'
IMG_SIZE = (112, 112)
SIMILARITY_THRESHOLD = 0.8  # Cosine similarity threshold for 'similar'
EYE_AR_THRESH = 0.21  # Eye aspect ratio threshold for blink
EYE_AR_CONSEC_FRAMES = 2  # Number of consecutive frames for a blink
LOGS_DIR = 'logs'

# --- Ensure logs directory exists ---
os.makedirs(LOGS_DIR, exist_ok=True)

# --- Load TFLite Model ---
interpreter = tf.lite.Interpreter(model_path=TFLITE_MODEL_PATH)
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# --- Load Haar Cascade ---
face_cascade = cv2.CascadeClassifier(CASCADE_PATH)

# --- Load Dlib for eye aspect ratio (EAR) ---
import dlib
predictor_path = '/Users/manassrv29/Desktop/project/expo-project/BlinkDetection/shape_predictor_68_face_landmarks.dat'
detector = dlib.get_frontal_face_detector()
predictor = dlib.shape_predictor(predictor_path)

def eye_aspect_ratio(eye):
    # compute the euclidean distances between the two sets of vertical eye landmarks (x, y)-coordinates
    A = np.linalg.norm(eye[1] - eye[5])
    B = np.linalg.norm(eye[2] - eye[4])
    # compute the euclidean distance between the horizontal eye landmark (x, y)-coordinates
    C = np.linalg.norm(eye[0] - eye[3])
    # compute the eye aspect ratio
    ear = (A + B) / (2.0 * C)
    return ear

# --- Preprocessing Function ---
def preprocess_face(img):
    img = cv2.resize(img, IMG_SIZE)
    img = img.astype(np.float32)
    img = img - 128
    img = img * 0.0078125
    img = np.expand_dims(img, axis=0)  # Add batch dimension
    return img

# --- Embedding Extraction ---
def get_embedding(face_img):
    preprocessed = preprocess_face(face_img)
    interpreter.set_tensor(input_details[0]['index'], preprocessed)
    interpreter.invoke()
    embedding = interpreter.get_tensor(output_details[0]['index'])
    embedding = embedding[0]  # Remove batch dimension
    # L2 normalize
    embedding = embedding / np.linalg.norm(embedding)
    return embedding

# --- Cosine Similarity ---
def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

# --- Reference Embedding ---
ref_img = cv2.imread(REFERENCE_IMAGE_PATH)
if ref_img is None:
    raise FileNotFoundError(f"Reference image not found: {REFERENCE_IMAGE_PATH}")
gray_ref = cv2.cvtColor(ref_img, cv2.COLOR_BGR2GRAY)
faces_ref = face_cascade.detectMultiScale(gray_ref, 1.3, 5)
if len(faces_ref) == 0:
    raise ValueError("No face detected in reference image!")
x, y, w, h = faces_ref[0]
ref_face = ref_img[y:y+h, x:x+w]
ref_embedding = get_embedding(ref_face)

# --- Blink Detection State ---
blink_prompted = False
blinked = False
COUNTER = 0
liveness_checked = False

# --- Webcam Loop ---
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    raise RuntimeError("Could not open webcam.")

print("Press 'q' to quit.")
while True:
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame.")
        break
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    for (x, y, w, h) in faces:
        face_img = frame[y:y+h, x:x+w]
        try:
            emb = get_embedding(face_img)
            sim = cosine_similarity(emb, ref_embedding)
            label = f"Similarity: {sim:.2f}"
            if sim > SIMILARITY_THRESHOLD and not liveness_checked:
                verdict = "Similar"
                color = (0, 255, 0)
                if not blink_prompted:
                    blink_prompted = True
                    print("Please blink once for liveness check...")
                # Use dlib for landmarks
                dlib_rects = detector(gray, 0)
                for rect in dlib_rects:
                    shape = predictor(gray, rect)
                    shape_np = np.zeros((68, 2), dtype='int')
                    for i in range(68):
                        shape_np[i] = (shape.part(i).x, shape.part(i).y)
                    # Left eye: 42-47, Right eye: 36-41
                    leftEye = shape_np[42:48]
                    rightEye = shape_np[36:42]
                    leftEAR = eye_aspect_ratio(leftEye)
                    rightEAR = eye_aspect_ratio(rightEye)
                    ear = (leftEAR + rightEAR) / 2.0
                    # Blink detection logic
                    if ear < EYE_AR_THRESH:
                        COUNTER += 1
                    else:
                        if COUNTER >= EYE_AR_CONSEC_FRAMES:
                            blinked = True
                        COUNTER = 0
                    if blinked and not liveness_checked:
                        # Save the face image
                        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                        save_path = os.path.join(LOGS_DIR, f'liveness_{timestamp}.jpg')
                        cv2.imwrite(save_path, face_img)
                        print(f'Liveness checked. Image saved to {save_path}')
                        liveness_checked = True
                        cv2.putText(frame, "Liveness checked", (x, y-40), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 0), 2)
            else:
                verdict = "Dissimilar"
                color = (0, 0, 255)
            cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
            cv2.putText(frame, verdict, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
            cv2.putText(frame, label, (x, y+h+30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        except Exception as e:
            cv2.putText(frame, "Error", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,0,255), 2)
    cv2.imshow('Webcam Face Similarity', frame)
    if cv2.waitKey(1) & 0xFF == ord('q') or liveness_checked:
        break
cap.release()
cv2.destroyAllWindows() 