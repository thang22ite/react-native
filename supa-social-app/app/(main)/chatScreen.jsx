import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from '../../components/Header'; // Sử dụng import gốc
import {
    View,
    TextInput,
    FlatList,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    TouchableOpacity,
    SafeAreaView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Đảm bảo đã cài đặt @expo/vector-icons

import { supabase } from '../../lib/supabase'; // Sử dụng import gốc
import { useAuth } from '../../contexts/AuthContext'; // Sử dụng import gốc

// --- Bộ Câu hỏi & Câu trả lời (FAQ) ---
// (Giữ nguyên bộ FAQ đã cung cấp)
const faqData = [
    {
        id: 'q1',
        category: 'Tài khoản & Đăng nhập',
        question: 'Lam sao de dang ky tai khoan moi?',
        answer: 'Bạn nhấn vào nút "Đăng ký" trên màn hình chính, sau đó điền email, mật khẩu và tên hiển thị. Xác nhận email là xong!',
        keywords: ['đăng ký', 'tài khoản mới', 'tạo acc', 'register', 'tạo tài khoản'] // Thêm keyword
    },
    {
        id: 'q2',
        category: 'Tài khoản & Đăng nhập',
        question: 'Toi quen mat khau, phai lam sao?',
        answer: 'Bạn hãy nhấn vào "Quên mật khẩu?" trên màn hình đăng nhập. Chúng tôi sẽ gửi một email để bạn đặt lại mật khẩu mới.',
        keywords: ['quên mật khẩu', 'mất pass', 'reset password', 'lấy lại mật khẩu', 'forgot password']
    },
    {
        id: 'q3',
        category: 'Tài khoản & Đăng nhập',
        question: 'Toi co the doi ten hien thi khong?',
        answer: 'Có! Vào "Cài đặt" -> "Thông tin cá nhân" -> "Chỉnh sửa tên" và lưu thay đổi.',
        keywords: ['đổi tên', 'thay tên', 'tên hiển thị', 'nickname', 'display name', 'chỉnh tên']
    },
    {
        id: 'q4',
        category: 'Kết bạn & Giao tiếp',
        question: 'Làm sao để kết bạn với người khác?',
        answer: 'Bạn tìm tên người đó trên thanh tìm kiếm, sau đó nhấn nút "Kết bạn" bên cạnh tên họ.',
        keywords: ['kết bạn', 'add friend', 'tìm bạn', 'thêm bạn', 'gửi lời mời']
    },
    {
        id: 'q5',
        category: 'Kết bạn & Giao tiếp',
        question: 'Tôi có thể gửi tin nhắn cho người chưa kết bạn không?',
        answer: 'Bạn chỉ có thể nhắn tin cho người đã chấp nhận lời mời kết bạn.',
        keywords: ['nhắn tin', 'người lạ', 'chưa kết bạn', 'chat', 'pm']
    },
    {
        id: 'q6',
        category: 'Kết bạn & Giao tiếp',
        question: 'Tôi muốn hủy kết bạn với ai đó, làm thế nào?',
        answer: 'Vào trang cá nhân của họ, nhấn vào nút "Bạn bè" và chọn "Hủy kết bạn".',
        keywords: ['hủy kết bạn', 'unfriend', 'xóa bạn', 'remove friend']
    },
    {
        id: 'q7',
        category: 'Đăng bài & Nội dung',
        question: 'Làm sao để đăng một bài viết mới?',
        answer: 'Nhấn vào nút "+" hoặc "Đăng bài" trên trang chủ, viết nội dung, thêm hình ảnh (nếu muốn) và bấm "Đăng".',
        keywords: ['đăng bài', 'viết bài', 'post', 'tạo bài', 'chia sẻ']
    },
    {
        id: 'q8',
        category: 'Đăng bài & Nội dung',
        question: 'Tôi có thể chỉnh sửa bài viết sau khi đăng không?',
        answer: 'Có. Bạn chỉ cần nhấn vào biểu tượng ba chấm (...) ở góc bài viết và chọn "Chỉnh sửa bài viết".',
        keywords: ['chỉnh sửa', 'sửa bài', 'edit post', 'cập nhật bài']
    },
    {
        id: 'q9',
        category: 'Đăng bài & Nội dung',
        question: 'Tôi muốn xóa bài đăng, làm thế nào?',
        answer: 'Vào bài viết bạn muốn xóa, nhấn vào biểu tượng (...) và chọn "Xóa bài viết".',
        keywords: ['xóa bài', 'delete post', 'gỡ bài', 'remove post']
    },
    {
        id: 'q10',
        category: 'Bảo mật & Quyền riêng tư',
        question: 'Tôi có thể ẩn bài viết với một số người không?',
        answer: 'Được! Khi đăng bài, bạn có thể chọn chế độ "Bạn bè", "Riêng tư", hoặc "Tùy chỉnh đối tượng".',
        keywords: ['ẩn bài', 'quyền riêng tư', 'privacy', 'đối tượng xem', 'ai xem được']
    },
    {
        id: 'q11',
        category: 'Bảo mật & Quyền riêng tư',
        question: 'Làm sao để chặn một người dùng?',
        answer: 'Vào trang cá nhân của họ, nhấn vào biểu tượng ba chấm và chọn "Chặn".',
        keywords: ['chặn', 'block user', 'không muốn thấy', 'block']
    },
    {
        id: 'q12',
        category: 'Bảo mật & Quyền riêng tư',
        question: 'Tôi muốn báo cáo một tài khoản giả mạo thì làm sao?',
        answer: 'Bạn nhấn vào biểu tượng ba chấm trên trang cá nhân của họ và chọn "Báo cáo tài khoản".',
        keywords: ['báo cáo', 'report', 'tài khoản giả', 'fake account', 'mạo danh']
    },
    {
        id: 'q13',
        category: 'Lỗi & Hỗ trợ',
        question: 'Ứng dụng không gửi mã xác nhận về email cho tôi?',
        answer: 'Hãy kiểm tra mục Spam/Hộp thư rác. Nếu vẫn không thấy, vui lòng yêu cầu gửi lại mã hoặc liên hệ bộ phận hỗ trợ.',
        keywords: ['mã xác nhận', 'otp', 'verification code', 'không nhận được email', 'email xác thực']
    },
    {
        id: 'q14',
        category: 'Lỗi & Hỗ trợ',
        question: 'Ứng dụng bị lỗi, tôi cần làm gì?',
        answer: 'Bạn có thể thử đóng app và mở lại. Nếu lỗi vẫn xảy ra, hãy cập nhật ứng dụng lên phiên bản mới nhất hoặc báo cáo lỗi cho chúng tôi.',
        keywords: ['lỗi', 'app lỗi', 'bug', 'không chạy', 'crash', 'ứng dụng dừng']
    },
    {
        id: 'q15',
        category: 'Lỗi & Hỗ trợ',
        question: 'Tôi bị đăng xuất khỏi tài khoản mà không rõ lý do?',
        answer: 'Có thể do bạn đăng nhập ở thiết bị khác hoặc ứng dụng phát hiện hoạt động bất thường. Hãy đổi mật khẩu để bảo mật tài khoản.',
        keywords: ['đăng xuất', 'logout', 'bị văng ra', 'tự thoát', 'bị out']
    },
];

// --- Hàm tìm câu hỏi phù hợp trong FAQ (Cải thiện một chút) ---
const findRelevantFAQ = (userMessage) => {
    const lowerCaseMessage = userMessage.toLowerCase().trim();
    let bestMatch = null;
    let maxScore = 0;

    // Nếu tin nhắn quá ngắn, có thể bỏ qua tìm kiếm FAQ
    if (lowerCaseMessage.length < 5) return null;

    faqData.forEach(faq => {
        let currentScore = 0;
        const lowerCaseQuestion = faq.question.toLowerCase();

        // Tính điểm dựa trên keywords
        faq.keywords.forEach(keyword => {
            if (lowerCaseMessage.includes(keyword.toLowerCase())) {
                currentScore += 1; // Cộng điểm cho mỗi keyword khớp
            }
        });

        // Tính điểm dựa trên độ tương đồng câu hỏi (đơn giản)
        // Ví dụ: kiểm tra xem các từ quan trọng trong câu hỏi FAQ có trong tin nhắn không
        const questionWords = lowerCaseQuestion.split(' ').filter(w => w.length > 2 && !['làm', 'sao', 'để', 'thế', 'nào', 'tôi', 'có', 'thể', 'không'].includes(w)); // Lọc từ không quan trọng
        let questionMatchCount = 0;
        questionWords.forEach(word => {
            if (lowerCaseMessage.includes(word)) {
                questionMatchCount++;
            }
        });
        // Tăng điểm nếu có nhiều từ trong câu hỏi FAQ khớp
        if (questionWords.length > 0) {
            currentScore += (questionMatchCount / questionWords.length) * 2; // Tỷ lệ khớp * trọng số
        }


        // Cập nhật bestMatch nếu điểm cao hơn
        if (currentScore > maxScore) {
            maxScore = currentScore;
            bestMatch = faq;
        }
    });

    // Chỉ trả về kết quả nếu điểm đủ cao (ngưỡng tùy chỉnh)
    console.log(`Điểm khớp cao nhất cho "${userMessage}": ${maxScore}`);
    return maxScore >= 1.5 ? bestMatch : null; // Ví dụ: ngưỡng 1.5
};


const AI_API_ENDPOINT = 'https://api.cohere.ai/v1/chat';
// **CẢNH BÁO BẢO MẬT:** KHÔNG BAO GIỜ ĐỂ API KEY TRỰC TIẾP TRONG CODE CLIENT-SIDE Ở ỨNG DỤNG THỰC TẾ!
const AI_API_KEY = 'AI1evpPlSQW3G80mkpprXCyWTnHPqTUMh9vAqeDy'; // **CHỈ DÙNG CHO MỤC ĐÍCH THỬ NGHIỆM**


// --- Hàm callAiApi (Sử dụng FAQ nếu tìm thấy) ---
const callAiApi = async (userMessage, chatHistory = []) => {
    console.log('Gọi AI (Cohere) với tin nhắn:', userMessage);
    // console.log('Lịch sử chat nhận được:', chatHistory);

    // 1. Tìm FAQ liên quan
    const relevantFAQ = findRelevantFAQ(userMessage);
    let finalMessageToSend = '';
    let systemInstruction = '';

    if (relevantFAQ) {
        console.log('Tìm thấy FAQ liên quan:', relevantFAQ.question);
        // 2a. Tạo prompt dựa trên FAQ
        systemInstruction = `Bạn là trợ lý ảo hỗ trợ cho ứng dụng của chúng tôi. Hãy dựa vào thông tin sau để trả lời câu hỏi của người dùng một cách ngắn gọn, chính xác và thân thiện.
        ---
        Thông tin tham khảo (Câu hỏi thường gặp):
        Hỏi: "${relevantFAQ.question}"
        Đáp: "${relevantFAQ.answer}"
        ---
        Câu hỏi của người dùng:`;
        finalMessageToSend = `${systemInstruction}\n"${userMessage}"`;

    } else {
        console.log('Không tìm thấy FAQ liên quan. Trả lời bình thường.');
        // 2b. Sử dụng prompt chung
        // Có thể thêm tên ứng dụng hoặc vai trò cụ thể hơn ở đây
        systemInstruction = "Bạn là một trợ lý ảo hữu ích và thân thiện. Hãy trả lời câu hỏi sau của người dùng một cách rõ ràng:";
        finalMessageToSend = `${systemInstruction}\n"${userMessage}"`;
    }

    // console.log('Tin nhắn cuối cùng gửi đến Cohere:', finalMessageToSend);

    const cohereChatHistory = chatHistory.map(msg => ({
        role: msg.sender === 'user' ? 'USER' : 'CHATBOT',
        message: msg.text
    }));

    const requestBody = {
        message: finalMessageToSend, // Sử dụng tin nhắn đã xử lý
        chat_history: cohereChatHistory,
        model: "command-r-plus",
        temperature: relevantFAQ ? 0.2 : 0.5, // Giảm nhiệt độ nếu có FAQ để bám sát, tăng nhẹ nếu không có
        // connectors: [{"id": "web-search"}], // Cân nhắc bật nếu muốn AI tìm kiếm khi không có FAQ
    };

    try {
        const response = await fetch(AI_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_API_KEY}`,
            },
            body: JSON.stringify(requestBody),
        });

        const responseText = await response.text();

        if (!response.ok) {
            let errorData = {};
            try {
                errorData = JSON.parse(responseText);
                console.error('Lỗi API Cohere (JSON):', response.status, errorData);
                throw new Error(`Lỗi API: ${response.status} - ${errorData.message || 'Lỗi không rõ từ Cohere'}`);
            } catch (parseError) {
                console.error('Lỗi API Cohere (Không phải JSON):', response.status, responseText);
                throw new Error(`Lỗi API: ${response.status} - ${responseText}`);
            }
        }

        const data = JSON.parse(responseText);
        const aiResponseText = data.text?.trim();

        if (!aiResponseText) {
            console.error('Không tìm thấy trường "text" trong phản hồi Cohere:', data);
            throw new Error('Không nhận được nội dung trả lời hợp lệ từ AI (Cohere).');
        }

        return aiResponseText;

    } catch (error) {
        console.error('Lỗi cuối cùng trong hàm callAiApi:', error);
        // Trả về thông báo lỗi thân thiện hơn
        return `Xin lỗi, tôi đang gặp chút sự cố khi kết nối. Bạn vui lòng thử lại sau nhé. (Lỗi: ${error.message || 'Không xác định'})`;
    }
};
// --- Kết thúc hàm callAiApi ---


const ChatScreen = () => {
    // *** SỬ DỤNG useAuth THỰC TẾ TỪ CONTEXT ***
    const { user } = useAuth();
    // Lấy ID người dùng (quan trọng cho việc lưu/tải DB)
    const userId = user?.id;
    // Lấy tên hiển thị (tùy chọn, có thể null nếu context chưa cung cấp)
    const userName = user?.displayName || user?.email; // Lấy displayName hoặc email làm fallback

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const flatListRef = useRef(null);

    // Log tên người dùng khi component mount hoặc user thay đổi (để kiểm tra)
    useEffect(() => {
        if (userName) {
            console.log("Tên người dùng hiện tại:", userName);
        } else if (userId) {
             console.log("Đã có User ID nhưng chưa có tên hiển thị.");
        }
    }, [userName, userId]);

    // --- Hàm lưu tin nhắn vào Supabase (Sử dụng Supabase thực tế) ---
    const saveMessageToDb = useCallback(async (messageToSave) => {
        if (!userId) {
            console.warn("Lưu tin nhắn thất bại: Không có User ID.");
            return;
        }
        if (!messageToSave.text || !messageToSave.sender) {
            console.error("Lưu tin nhắn thất bại: Dữ liệu không hợp lệ.", messageToSave);
            return;
        }

        try {
            // console.log(`Đang lưu tin nhắn cho user ${userId}:`, messageToSave.text);
            const { data, error } = await supabase // Sử dụng supabase client thực tế
                .from('chatbotmessages') // Đảm bảo tên bảng là chính xác
                .insert([
                    {
                        user_id: userId,
                        sender: messageToSave.sender,
                        message: messageToSave.text, // Đảm bảo tên cột là 'message'
                    },
                ])
                .select(); // Có thể bỏ .select() nếu không cần dữ liệu trả về

            if (error) {
                console.error('Lỗi Supabase khi lưu tin nhắn:', error);
                // Cân nhắc hiển thị thông báo lỗi nhẹ nhàng cho người dùng
                // Alert.alert("Lỗi", "Không thể lưu tin nhắn của bạn vào lúc này.");
            } else {
                // console.log('Đã lưu tin nhắn thành công:', data);
            }
        } catch (error) {
            console.error('Lỗi không mong muốn khi lưu tin nhắn:', error);
        }
    }, [userId]); // Phụ thuộc vào userId

    // --- Load lịch sử chat (Sử dụng Supabase thực tế) ---
    useEffect(() => {
        const loadChatHistory = async () => {
            if (!userId) {
                console.log("Chưa có user, không tải lịch sử.");
                setIsLoadingHistory(false);
                setMessages([]); // Xóa tin nhắn cũ nếu user thay đổi
                return;
            }
            console.log("Đang tải lịch sử chat cho user:", userId);
            setIsLoadingHistory(true);
            try {
                const { data, error } = await supabase // Sử dụng supabase client thực tế
                    .from('chatbotmessages') // Đảm bảo tên bảng là chính xác
                    .select('id, sender, message, created_at') // Đảm bảo tên cột đúng
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false }) // Lấy mới nhất trước
                    .limit(50); // Giới hạn số lượng tin nhắn

                if (error) {
                    console.error('Lỗi Supabase khi tải lịch sử chat:', error);
                    Alert.alert("Lỗi", "Không thể tải lịch sử trò chuyện.");
                    setMessages([]);
                } else if (data) {
                    console.log("Đã tải", data.length, "tin nhắn từ lịch sử.");
                    const loadedMessages = data.map(dbMsg => ({
                        id: dbMsg.id,
                        text: dbMsg.message, // Map đúng cột 'message' sang 'text'
                        sender: dbMsg.sender,
                        timestamp: new Date(dbMsg.created_at),
                    })).reverse(); // Đảo ngược để hiển thị đúng thứ tự
                    setMessages(loadedMessages);
                } else {
                     console.log("Không có lịch sử chat nào được tìm thấy.");
                     setMessages([]); // Đảm bảo là mảng rỗng nếu không có data
                }
            } catch (err) {
                console.error("Lỗi không mong muốn khi tải lịch sử:", err);
                Alert.alert("Lỗi", "Đã có lỗi xảy ra khi tải dữ liệu trò chuyện.");
                 setMessages([]);
            } finally {
                setIsLoadingHistory(false); // Luôn tắt loading
            }
        };

        loadChatHistory();
        // Chạy lại khi userId thay đổi (ví dụ: login/logout)
    }, [userId]);

    // --- Hàm xử lý gửi tin nhắn (Chuẩn bị và gửi chatHistory) ---
    const handleSend = useCallback(async () => {
        const userMessageText = inputText.trim();
        if (!userId) {
             Alert.alert("Thông báo", "Bạn cần đăng nhập để có thể trò chuyện.");
             return;
        }
        if (!userMessageText) return; // Không gửi tin nhắn rỗng

        setIsLoading(true);
        setInputText(''); // Xóa input ngay lập tức

        const userMessage = {
            id: `local-user-${Date.now()}`, // ID tạm thời cho local state
            text: userMessageText,
            sender: 'user',
            timestamp: new Date(),
        };

        // Cập nhật UI ngay lập tức với tin nhắn người dùng
        const updatedMessages = [userMessage, ...messages];
        setMessages(updatedMessages);

        // Lưu tin nhắn người dùng vào DB (bất đồng bộ)
        await saveMessageToDb(userMessage);

        // Chuẩn bị lịch sử chat cho API (lấy từ state đã cập nhật)
        const chatHistoryForApi = updatedMessages
            .slice(0, 10) // Giới hạn số lượng tin nhắn gửi làm context
            .reverse() // API thường cần thứ tự thời gian tăng dần
            .map(msg => ({ text: msg.text, sender: msg.sender })); // Chỉ gửi text và sender

        // Gọi API AI với tin nhắn và lịch sử
        const aiResponseText = await callAiApi(userMessageText, chatHistoryForApi);

        const aiMessage = {
            id: `local-ai-${Date.now()}`, // ID tạm thời cho local state
            text: aiResponseText,
            sender: 'ai',
            timestamp: new Date(),
        };

        // Cập nhật UI với tin nhắn AI
        setMessages(prevMessages => [aiMessage, ...prevMessages]);

        // Lưu tin nhắn AI vào DB (bất đồng bộ)
        await saveMessageToDb(aiMessage);

        setIsLoading(false); // Kết thúc loading
    }, [inputText, messages, userId, saveMessageToDb]); // Dependencies

    // Hàm render mỗi item tin nhắn (Giữ nguyên)
    const renderMessageItem = ({ item }) => (
        <View
            style={[
                styles.messageBubble,
                item.sender === 'user' ? styles.userMessage : styles.aiMessage,
            ]}
        >
            <Text style={[styles.messageText, item.sender === 'user' ? styles.userMessageText : styles.aiMessageText]}>
                {item.text}
            </Text>
        </View>
    );

    // --- Render chính ---
    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Sử dụng Header gốc và hiển thị tên nếu có */}
            <Header title={`ChatBot Hỗ Trợ`} />

            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // Điều chỉnh nếu cần
            >
                {/* Hiển thị loading khi tải lịch sử */}
                {isLoadingHistory && (
                    <View style={styles.historyLoadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
                    </View>
                )}

                {/* Chỉ hiển thị FlatList khi đã load xong và có user */}
                {!isLoadingHistory && userId && (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessageItem}
                        keyExtractor={(item) => item.id} // Sử dụng ID từ DB hoặc ID tạm thời
                        style={styles.messageList}
                        inverted // Quan trọng: Giữ inverted để chat hiển thị đúng
                        contentContainerStyle={styles.messageListContent}
                        // Tự động cuộn xuống khi có tin nhắn mới (do inverted)
                    />
                )}
                 {/* Thông báo nếu chưa đăng nhập */}
                 {!isLoadingHistory && !userId && (
                     <View style={styles.historyLoadingContainer}>
                         <Text style={styles.loadingText}>Vui lòng đăng nhập để bắt đầu trò chuyện.</Text>
                     </View>
                 )}

                {/* Hiển thị loading indicator của AI */}
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#007AFF" />
                        <Text style={styles.loadingText}>AI đang trả lời...</Text>
                    </View>
                )}

                {/* Khu vực nhập liệu */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder={userId ? "Nhập câu hỏi của bạn..." : "Vui lòng đăng nhập"}
                        placeholderTextColor="#999"
                        multiline
                        editable={!isLoading && !isLoadingHistory && !!userId} // Chỉ cho nhập khi không load và đã đăng nhập
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            // Disable nút khi đang load, chưa đăng nhập, hoặc input rỗng
                            (isLoading || isLoadingHistory || !userId || inputText.trim().length === 0) && styles.sendButtonDisabled
                        ]}
                        onPress={handleSend}
                        disabled={isLoading || isLoadingHistory || !userId || inputText.trim().length === 0}
                    >
                        <Ionicons name="send" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// StyleSheet (Giữ nguyên)
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        marginTop: 20,
        backgroundColor: '#F5F5F5',
    },
    container: {
        flex: 1,
    },
    historyLoadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    messageList: {
        flex: 1,
        paddingHorizontal: 10,
    },
    messageListContent: {
        paddingTop: 10,
        flexGrow: 1,
        justifyContent: 'flex-end',
    },
    messageBubble: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginBottom: 10,
        maxWidth: '80%',
    },
    userMessage: {
        backgroundColor: '#007AFF',
        alignSelf: 'flex-end',
        marginLeft: 'auto',
    },
    aiMessage: {
        backgroundColor: '#E5E5EA',
        alignSelf: 'flex-start',
        marginRight: 'auto',
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    userMessageText: {
        color: '#FFFFFF',
    },
    aiMessageText: {
        color: '#000000',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#DDD',
        backgroundColor: '#FFFFFF',
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 120,
        backgroundColor: '#F0F0F0',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'ios' ? 10 : 8,
        fontSize: 16,
        marginRight: 10,
    },
    sendButton: {
        backgroundColor: '#007AFF',
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#B0C4DE',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 5,
        backgroundColor: '#FFFFFF',
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
});

export default ChatScreen;


























// import React, { useState, useCallback, useEffect, useRef } from 'react';
// import Header from '../../components/Header'
// import {
//   View,
//   TextInput,
//   // Button, // Không dùng nữa
//   FlatList,
//   Text,
//   StyleSheet,
//   KeyboardAvoidingView,
//   Platform,
//   ActivityIndicator,
//   TouchableOpacity,
//   SafeAreaView,
//   Alert, // Thêm Alert để thông báo lỗi (tùy chọn)
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';


// import { supabase } from '../../lib/supabase'; 
// import { useAuth } from '../../contexts/AuthContext'; // 
// // ---


// const AI_API_ENDPOINT = 'https://api.cohere.ai/v1/chat';
// const AI_API_KEY = 'AI1evpPlSQW3G80mkpprXCyWTnHPqTUMh9vAqeDy'; // **Nhắc lại: KHÔNG an toàn ở client**


// // --- Hàm callAiApi (Sử dụng phiên bản đã sửa cho Cohere) ---
// const callAiApi = async (userMessage, chatHistory = []) => {
//     console.log('Gọi AI (Cohere) với tin nhắn:', userMessage);
//     // console.log('Lịch sử chat gửi đi:', chatHistory);

//     const cohereChatHistory = chatHistory.map(msg => ({
//       role: msg.sender === 'user' ? 'USER' : 'CHATBOT',
//       message: msg.text
//     }));

//     const requestBody = {
//       message: userMessage,
//       chat_history: cohereChatHistory,
//       model: "command-r-plus",
//       // connectors: [{"id": "web-search"}],
//       // temperature: 0.3,
//     };

//     // console.log('Request Body gửi đến Cohere:', JSON.stringify(requestBody, null, 2));

//     try {
//       const response = await fetch(AI_API_ENDPOINT, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${AI_API_KEY}`,
//         },
//         body: JSON.stringify(requestBody),
//       });

//       const responseText = await response.text();
//       // console.log('Phản hồi RAW từ Cohere:', response.status, responseText);

//       if (!response.ok) {
//          let errorData = {};
//          try {
//              errorData = JSON.parse(responseText);
//              console.error('Lỗi API Cohere (JSON):', response.status, errorData);
//              throw new Error(`Lỗi API: ${response.status} - ${errorData.message || 'Lỗi không rõ từ Cohere'}`);
//          } catch (parseError) {
//              console.error('Lỗi API Cohere (Không phải JSON):', response.status, responseText);
//              throw new Error(`Lỗi API: ${response.status} - ${responseText}`);
//          }
//       }

//       const data = JSON.parse(responseText);
//       // console.log('Phản hồi JSON từ Cohere:', data);

//       const aiResponseText = data.text?.trim();

//       if (!aiResponseText) {
//         console.error('Không tìm thấy trường "text" trong phản hồi Cohere:', data);
//         throw new Error('Không nhận được nội dung trả lời hợp lệ từ AI (Cohere).');
//       }

//       return aiResponseText;

//     } catch (error) {
//       console.error('Lỗi cuối cùng trong hàm callAiApi:', error);
//        return `Đã xảy ra lỗi khi kết nối với AI: ${error.message || 'Lỗi không xác định'}`;
//     }
//   };
// // --- Kết thúc hàm callAiApi ---


// const ChatScreen = () => {
//   const { user } = useAuth(); // Lấy thông tin user từ context
//   const [messages, setMessages] = useState([]);
//   const [inputText, setInputText] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [isLoadingHistory, setIsLoadingHistory] = useState(true); // State load lịch sử chat
//   const flatListRef = useRef(null);

//   // --- Hàm lưu tin nhắn vào Supabase ---
//   const saveMessageToDb = async (messageToSave) => {
//     if (!user?.id) {
//         console.error("Không tìm thấy user ID để lưu tin nhắn.");
//         return; // Không lưu nếu không có user ID
//     }
//     if (!messageToSave.text || !messageToSave.sender) {
//         console.error("Dữ liệu tin nhắn không hợp lệ:", messageToSave);
//         return; // Không lưu nếu thiếu thông tin
//     }

//     try {
//         console.log("Đang lưu tin nhắn:", {
//             user_id: user.id,
//             sender: messageToSave.sender, // 'user' hoặc 'ai'
//             message: messageToSave.text, // Nội dung tin nhắn
//         });
//         const { data, error } = await supabase
//             .from('chatbotmessages')
//             .insert([
//                 {
//                     user_id: user.id,
//                     sender: messageToSave.sender, // 'user' hoặc 'ai'
//                     message: messageToSave.text, // Nội dung tin nhắn
//                 },
//             ])
//             .select(); // Có thể .select() để lấy lại dữ liệu vừa insert nếu cần

//         if (error) {
//             console.error('Lỗi khi lưu tin nhắn vào Supabase:', error);
//             // Có thể hiển thị thông báo lỗi cho người dùng ở đây
//             // Alert.alert("Lỗi", "Không thể lưu tin nhắn vào cơ sở dữ liệu.");
//         } else {
//             console.log('Đã lưu tin nhắn thành công:', data);
//         }
//     } catch (error) {
//         console.error('Lỗi không mong muốn khi lưu tin nhắn:', error);
//     }
//   };
//   // --- Kết thúc hàm lưu tin nhắn ---


//   // --- Load lịch sử chat khi màn hình được mở ---
//   useEffect(() => {
//     const loadChatHistory = async () => {
//         if (!user?.id) {
//             console.log("Chưa có user, chưa load lịch sử.");
//             setIsLoadingHistory(false); // Kết thúc load nếu chưa có user
//             return;
//         }
//         console.log("Đang tải lịch sử chat cho user:", user.id);
//         setIsLoadingHistory(true);
//         try {
//             const { data, error } = await supabase
//                 .from('chatbotmessages')
//                 .select('id, sender, message, created_at') // Lấy các cột cần thiết
//                 .eq('user_id', user.id) // Chỉ lấy tin nhắn của user hiện tại
//                 .order('created_at', { ascending: false }) // Sắp xếp mới nhất lên trên
//                 .limit(50); // Giới hạn số lượng tin nhắn tải về

//             if (error) {
//                 console.error('Lỗi khi tải lịch sử chat:', error);
//                 Alert.alert("Lỗi", "Không thể tải lịch sử trò chuyện.");
//             } else if (data) {
//                 console.log("Lịch sử chat tải về:", data.length, "tin nhắn");
//                 // Chuyển đổi dữ liệu từ DB sang định dạng state `messages`
//                 const loadedMessages = data.map(dbMsg => ({
//                     id: dbMsg.id,
//                     text: dbMsg.message, // Map 'message' sang 'text'
//                     sender: dbMsg.sender, // 'user' hoặc 'ai'
//                     timestamp: new Date(dbMsg.created_at), // Chuyển đổi timestamp
//                 }));
//                 // Đảo ngược lại để hiển thị đúng thứ tự trong FlatList `inverted`
//                 setMessages(loadedMessages.reverse());
//             }
//         } catch (err) {
//             console.error("Lỗi không mong muốn khi tải lịch sử:", err);
//             Alert.alert("Lỗi", "Đã có lỗi xảy ra khi tải dữ liệu.");
//         } finally {
//             setIsLoadingHistory(false); // Luôn ẩn loading sau khi kết thúc
//         }
//     };

//     loadChatHistory();
//     // Chỉ chạy lại khi user.id thay đổi (ví dụ: login/logout)
//   }, [user?.id]);
//   // --- Kết thúc load lịch sử chat ---


//   // Hàm xử lý khi người dùng gửi tin nhắn
//   const handleSend = useCallback(async () => {
//     const userMessageText = inputText.trim();
//     if (!userMessageText || !user?.id) return; // Không gửi nếu rỗng hoặc chưa có user

//     setIsLoading(true); // Bắt đầu loading AI (loading lịch sử là riêng)
//     setInputText(''); // Xóa input ngay

//     // 1. Tạo tin nhắn người dùng
//     const userMessage = {
//       id: `user-${Date.now()}-${Math.random()}`,
//       text: userMessageText,
//       sender: 'user',
//       timestamp: new Date(),
//     };

//     // Cập nhật UI trước
//     setMessages(prevMessages => [userMessage, ...prevMessages]);

//     // *** LƯU TIN NHẮN NGƯỜI DÙNG VÀO DB ***
//     await saveMessageToDb(userMessage);
//     // *** KẾT THÚC LƯU ***

//     // 2. Chuẩn bị lịch sử chat cho API
//     const chatHistoryForApi = messages
//         .slice(0, 10) // Lấy 10 tin nhắn gần nhất từ state hiện tại
//         .reverse()
//         .map(msg => ({ text: msg.text, sender: msg.sender }));

//     // 3. Gọi API AI
//     const aiResponseText = await callAiApi(userMessageText, chatHistoryForApi);

//     // 4. Tạo tin nhắn của AI
//     const aiMessage = {
//       id: `ai-${Date.now()}-${Math.random()}`,
//       text: aiResponseText,
//       sender: 'ai',
//       timestamp: new Date(),
//     };

//     // Cập nhật UI với tin nhắn AI
//     setMessages(prevMessages => [aiMessage, ...prevMessages]);

//     // *** LƯU TIN NHẮN AI VÀO DB ***
//     await saveMessageToDb(aiMessage);
//     // *** KẾT THÚC LƯU ***

//     setIsLoading(false); // Kết thúc loading AI
//   }, [inputText, messages, user?.id, saveMessageToDb]); // Thêm user?.id và saveMessageToDb vào dependencies


//   // Hàm render mỗi item tin nhắn trong FlatList
//   const renderMessageItem = ({ item }) => (
//     <View
//       style={[
//         styles.messageBubble,
//         item.sender === 'user' ? styles.userMessage : styles.aiMessage,
//       ]}
//     >
//       {/* Thêm phân biệt màu chữ nếu muốn */}
//       <Text style={[styles.messageText, item.sender === 'user' ? styles.userMessageText : styles.aiMessageText]}>
//           {item.text}
//       </Text>
//     </View>
//   );

//   // --- Render chính ---
//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <Header title="ChatBot" />
      
//       <KeyboardAvoidingView
//         style={styles.container}
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
//       >
//         {/* Hiển thị loading khi tải lịch sử */}
//         {isLoadingHistory && (
//              <View style={styles.historyLoadingContainer}>
//                  <ActivityIndicator size="large" color="#007AFF" />
//                  <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
//              </View>
//         )}

//         {/* Chỉ hiển thị FlatList khi đã load xong lịch sử */}
//         {!isLoadingHistory && (
//             <FlatList
//             ref={flatListRef}
//             data={messages}
//             renderItem={renderMessageItem}
//             keyExtractor={(item) => item.id}
//             style={styles.messageList}
//             inverted // Quan trọng để hiển thị đúng và tự cuộn
//             contentContainerStyle={styles.messageListContent}
//             />
//         )}


//         {/* Hiển thị loading indicator của AI */}
//         {isLoading && (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="small" color="#007AFF" />
//             <Text style={styles.loadingText}>AI đang trả lời...</Text>
//           </View>
//         )}

//         {/* Khu vực nhập liệu */}
//         <View style={styles.inputContainer}>
//           <TextInput
//             style={styles.input}
//             value={inputText}
//             onChangeText={setInputText}
//             placeholder="Nhập tin nhắn..."
//             placeholderTextColor="#999"
//             multiline
//             editable={!isLoading && !isLoadingHistory} // Không cho nhập khi đang load
//           />
//           <TouchableOpacity
//              style={[
//                  styles.sendButton,
//                  (isLoading || isLoadingHistory || inputText.trim().length === 0) && styles.sendButtonDisabled
//              ]}
//              onPress={handleSend}
//              disabled={isLoading || isLoadingHistory || inputText.trim().length === 0}
//            >
//              <Ionicons name="send" size={24} color="white" />
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };


// // StyleSheet (Thêm style cho loading history và màu chữ)
// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#F5F5F5',
//   },
//   container: {
//     flex: 1,
//   },
//   // Style cho loading history (hiển thị ở giữa màn hình)
//   historyLoadingContainer: {
//       flex: 1,
//       justifyContent: 'center',
//       alignItems: 'center',
//   },
//   messageList: {
//     flex: 1,
//     paddingHorizontal: 10,
//   },
//   messageListContent: {
//       paddingTop: 10,
//       flexGrow: 1,
//       justifyContent: 'flex-end',
//   },
//   messageBubble: {
//     paddingVertical: 10,
//     paddingHorizontal: 15,
//     borderRadius: 20,
//     marginBottom: 10,
//     maxWidth: '80%',
//   },
//   userMessage: {
//     backgroundColor: '#007AFF',
//     alignSelf: 'flex-end',
//     marginLeft: 'auto',
//   },
//   aiMessage: {
//     backgroundColor: '#E5E5EA',
//     alignSelf: 'flex-start',
//     marginRight: 'auto',
//   },
//   messageText: {
//     fontSize: 16,
//     // Màu chữ mặc định không cần thiết nếu đã set riêng
//   },
//   userMessageText: {
//       color: '#FFFFFF', // Chữ trắng cho tin nhắn người dùng
//   },
//   aiMessageText: {
//       color: '#000000', // Chữ đen cho tin nhắn AI
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 10,
//     paddingVertical: 8,
//     borderTopWidth: 1,
//     borderTopColor: '#DDD',
//     backgroundColor: '#FFFFFF',
//   },
//   input: {
//     flex: 1,
//     minHeight: 40,
//     maxHeight: 120,
//     backgroundColor: '#F0F0F0',
//     borderRadius: 20,
//     paddingHorizontal: 15,
//     paddingVertical: Platform.OS === 'ios' ? 10 : 8, // Điều chỉnh padding cho phù hợp
//     fontSize: 16,
//     marginRight: 10,
//   },
//   sendButton: {
//     backgroundColor: '#007AFF',
//     borderRadius: 20,
//     padding: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   sendButtonDisabled: {
//       backgroundColor: '#B0C4DE',
//   },
//   loadingContainer: { // Loading của AI (thường ở trên input)
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 8,
//     backgroundColor: '#FFFFFF', // Cùng màu nền với input container
//   },
//   loadingText: {
//     marginLeft: 8,
//     fontSize: 14,
//     color: '#666',
//   },
// });

// export default ChatScreen;