import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
import joblib
import os # Import os module
# Sử dụng OneVsRestClassifier để xử lý đa nhãn với các bộ phân loại đơn nhãn
from sklearn.multiclass import OneVsRestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score, hamming_loss, jaccard_score
import regex # Cho tiền xử lý cơ bản (tùy chọn)

# --- 1. Đọc và chuẩn bị dữ liệu ---
try:
    # Thay 'your_data.csv' bằng tên file CSV của bạn
    df = pd.read_csv('D:/react/supa-social-app/AIModel/translated_toxic_comment.csv')
    print(f"Đã đọc thành công file CSV. Số lượng mẫu: {len(df)}")
    print("5 dòng dữ liệu đầu tiên:")
    print(df.head())
    print("\nThông tin DataFrame:")
    df.info()
    print("\nKiểm tra giá trị thiếu:")
    print(df.isnull().sum()) # Xem có dòng nào thiếu comment không

    # Xử lý giá trị thiếu nếu có (ví dụ: điền bằng chuỗi rỗng)
    df['translated_comment_text'].fillna('', inplace=True)

except FileNotFoundError:
    print("Lỗi: Không tìm thấy file 'your_data.csv'. Vui lòng kiểm tra lại tên file và đường dẫn.")
    exit()
except Exception as e:
    print(f"Lỗi khi đọc file CSV: {e}")
    exit()


# --- (Tùy chọn) Tiền xử lý cơ bản ---
def preprocess_text(text):
    if not isinstance(text, str): # Đảm bảo đầu vào là chuỗi
        return ""
    text = text.lower()
    text = text.replace('_', ' ')
    text = regex.sub(r'[^\p{L}\p{N}\s]', '', text)
    text = regex.sub(r'\s+', ' ', text).strip()
    return text

# Áp dụng tiền xử lý nếu muốn
df['comment_cleaned'] = df['translated_comment_text'].apply(preprocess_text)
X = df['comment_cleaned']

# Chọn các cột nhãn làm đầu ra y
label_columns = ['toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate']
y = df[label_columns]
mask = y.notnull().all(axis=1)  # chỉ giữ dòng không có NaN ở tất cả nhãn
X = X[mask]
y = y[mask]

print("\n--- Dữ liệu đầu vào (X) - 5 mẫu đầu ---")
print(X.head())
print("\n--- Dữ liệu đầu ra (y) - 5 mẫu đầu ---")
print(y.head())
print("\n")


# --- Chia dữ liệu thành tập huấn luyện và tập kiểm thử ---
# Với multi-label, stratify phức tạp hơn, tạm thời bỏ qua để đơn giản
# test_size=0.2 nghĩa là 20% dữ liệu dùng để kiểm thử
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print(f"Số lượng mẫu huấn luyện: {len(X_train)}")
print(f"Số lượng mẫu kiểm thử: {len(X_test)}\n")


# --- 2 & 3. Xây dựng Pipeline: Tiền xử lý (TF-IDF) và Huấn luyện Mô hình (Naive Bayes với OneVsRest) ---

# Bước 1: Vector hóa văn bản bằng TF-IDF
tfidf_vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=5000) # Giới hạn số lượng features

# Bước 2: Mô hình phân loại cơ sở (Naive Bayes)
naive_bayes_classifier = MultinomialNB()

# Bước 3: Sử dụng OneVsRestClassifier để huấn luyện một bộ phân loại riêng cho mỗi nhãn
# OneVsRestClassifier sẽ huấn luyện một mô hình NB cho 'toxic', một cho 'severe_toxic', v.v.
multi_label_model = OneVsRestClassifier(naive_bayes_classifier)

# Tạo Pipeline
model_pipeline = Pipeline([
    ('tfidf', tfidf_vectorizer),      # Bước vector hóa
    ('classifier', multi_label_model) # Bước phân loại đa nhãn
])

print("--- Bắt đầu huấn luyện mô hình đa nhãn ---")
# Huấn luyện mô hình trên dữ liệu huấn luyện
print("Có NaN trong y_train?", y_train.isnull().values.any())
print("Số dòng NaN:", y_train.isnull().sum())
model_pipeline.fit(X_train, y_train)
print("--- Huấn luyện hoàn tất ---\n")

# --- 4. Đánh giá mô hình ---
print("--- Đánh giá mô hình trên tập kiểm thử ---")
# Dự đoán nhãn cho dữ liệu kiểm thử
y_pred = model_pipeline.predict(X_test)

# --- Các chỉ số đánh giá cho Multi-label ---

# 1. Accuracy Score (Subset Accuracy): Tỷ lệ mẫu mà TẤT CẢ các nhãn đều được dự đoán đúng.
# Đây là chỉ số rất nghiêm ngặt.
subset_accuracy = accuracy_score(y_test, y_pred)
print(f"Độ chính xác (Subset Accuracy): {subset_accuracy:.4f}")

# 2. Hamming Loss: Tỷ lệ trung bình các nhãn bị dự đoán sai (nhỏ hơn là tốt hơn).
h_loss = hamming_loss(y_test, y_pred)
print(f"Hamming Loss: {h_loss:.4f}")

# 3. Jaccard Score (trung bình): Đo độ tương đồng giữa tập nhãn thật và tập nhãn dự đoán.
# average='samples' tính trung bình trên từng mẫu
jaccard_samples = jaccard_score(y_test, y_pred, average='samples')
# average='weighted' tính trung bình có trọng số theo support của từng nhãn
jaccard_weighted = jaccard_score(y_test, y_pred, average='weighted')
print(f"Jaccard Score (trung bình samples): {jaccard_samples:.4f}")
print(f"Jaccard Score (trung bình weighted): {jaccard_weighted:.4f}")


# 4. Classification Report: Hiển thị Precision, Recall, F1-score cho từng nhãn riêng biệt
# và các giá trị trung bình (micro, macro, weighted).
print("\nBáo cáo phân loại chi tiết (cho từng nhãn và trung bình):")
# target_names cung cấp tên cho các cột nhãn
# zero_division=0 để tránh lỗi chia cho 0 nếu một lớp không có mẫu nào trong test set hoặc không được dự đoán
print(classification_report(y_test, y_pred, target_names=label_columns, zero_division=0))

# Lưu ý: Confusion matrix cho multi-label thường được xem xét cho từng nhãn một.
# Ví dụ xem confusion matrix cho nhãn 'toxic':
# from sklearn.metrics import confusion_matrix
# print("\nMa trận nhầm lẫn cho nhãn 'toxic':")
# print(confusion_matrix(y_test['toxic'], y_pred[:, label_columns.index('toxic')])) # Lấy cột dự đoán tương ứng
# --- 5. Save the trained pipeline ---
model_filename = 'toxic_comment_model_pipeline.joblib'
# Define the directory path (relative to the script or absolute)
save_directory = 'D:/react/supa-social-app/AIModel/' # Or choose another location
model_filepath = os.path.join(save_directory, model_filename)

print(f"\n--- Saving trained model pipeline to {model_filepath} ---")
try:
    # Create the directory if it doesn't exist
    os.makedirs(save_directory, exist_ok=True)
    joblib.dump(model_pipeline, model_filepath)
    print("Model pipeline saved successfully.")
except Exception as e:
    print(f"Error saving model: {e}")
