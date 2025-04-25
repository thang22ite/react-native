import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from '../../components/Header'
import {
  View,
  TextInput,
  // Button, // Không dùng nữa
  FlatList,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Alert, // Thêm Alert để thông báo lỗi (tùy chọn)
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';


import { supabase } from '../../lib/supabase'; 
import { useAuth } from '../../contexts/AuthContext'; // 
// ---


const AI_API_ENDPOINT = 'https://api.cohere.ai/v1/chat';
const AI_API_KEY = 'AI1evpPlSQW3G80mkpprXCyWTnHPqTUMh9vAqeDy'; // **Nhắc lại: KHÔNG an toàn ở client**


// --- Hàm callAiApi (Sử dụng phiên bản đã sửa cho Cohere) ---
const callAiApi = async (userMessage, chatHistory = []) => {
    console.log('Gọi AI (Cohere) với tin nhắn:', userMessage);
    // console.log('Lịch sử chat gửi đi:', chatHistory);

    const cohereChatHistory = chatHistory.map(msg => ({
      role: msg.sender === 'user' ? 'USER' : 'CHATBOT',
      message: msg.text
    }));

    const requestBody = {
      message: userMessage,
      chat_history: cohereChatHistory,
      model: "command-r-plus",
      // connectors: [{"id": "web-search"}],
      // temperature: 0.3,
    };

    // console.log('Request Body gửi đến Cohere:', JSON.stringify(requestBody, null, 2));

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
      // console.log('Phản hồi RAW từ Cohere:', response.status, responseText);

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
      // console.log('Phản hồi JSON từ Cohere:', data);

      const aiResponseText = data.text?.trim();

      if (!aiResponseText) {
        console.error('Không tìm thấy trường "text" trong phản hồi Cohere:', data);
        throw new Error('Không nhận được nội dung trả lời hợp lệ từ AI (Cohere).');
      }

      return aiResponseText;

    } catch (error) {
      console.error('Lỗi cuối cùng trong hàm callAiApi:', error);
       return `Đã xảy ra lỗi khi kết nối với AI: ${error.message || 'Lỗi không xác định'}`;
    }
  };
// --- Kết thúc hàm callAiApi ---


const ChatScreen = () => {
  const { user } = useAuth(); // Lấy thông tin user từ context
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true); // State load lịch sử chat
  const flatListRef = useRef(null);

  // --- Hàm lưu tin nhắn vào Supabase ---
  const saveMessageToDb = async (messageToSave) => {
    if (!user?.id) {
        console.error("Không tìm thấy user ID để lưu tin nhắn.");
        return; // Không lưu nếu không có user ID
    }
    if (!messageToSave.text || !messageToSave.sender) {
        console.error("Dữ liệu tin nhắn không hợp lệ:", messageToSave);
        return; // Không lưu nếu thiếu thông tin
    }

    try {
        console.log("Đang lưu tin nhắn:", {
            user_id: user.id,
            sender: messageToSave.sender, // 'user' hoặc 'ai'
            message: messageToSave.text, // Nội dung tin nhắn
        });
        const { data, error } = await supabase
            .from('chatbotmessages')
            .insert([
                {
                    user_id: user.id,
                    sender: messageToSave.sender, // 'user' hoặc 'ai'
                    message: messageToSave.text, // Nội dung tin nhắn
                },
            ])
            .select(); // Có thể .select() để lấy lại dữ liệu vừa insert nếu cần

        if (error) {
            console.error('Lỗi khi lưu tin nhắn vào Supabase:', error);
            // Có thể hiển thị thông báo lỗi cho người dùng ở đây
            // Alert.alert("Lỗi", "Không thể lưu tin nhắn vào cơ sở dữ liệu.");
        } else {
            console.log('Đã lưu tin nhắn thành công:', data);
        }
    } catch (error) {
        console.error('Lỗi không mong muốn khi lưu tin nhắn:', error);
    }
  };
  // --- Kết thúc hàm lưu tin nhắn ---


  // --- Load lịch sử chat khi màn hình được mở ---
  useEffect(() => {
    const loadChatHistory = async () => {
        if (!user?.id) {
            console.log("Chưa có user, chưa load lịch sử.");
            setIsLoadingHistory(false); // Kết thúc load nếu chưa có user
            return;
        }
        console.log("Đang tải lịch sử chat cho user:", user.id);
        setIsLoadingHistory(true);
        try {
            const { data, error } = await supabase
                .from('chatbotmessages')
                .select('id, sender, message, created_at') // Lấy các cột cần thiết
                .eq('user_id', user.id) // Chỉ lấy tin nhắn của user hiện tại
                .order('created_at', { ascending: false }) // Sắp xếp mới nhất lên trên
                .limit(50); // Giới hạn số lượng tin nhắn tải về

            if (error) {
                console.error('Lỗi khi tải lịch sử chat:', error);
                Alert.alert("Lỗi", "Không thể tải lịch sử trò chuyện.");
            } else if (data) {
                console.log("Lịch sử chat tải về:", data.length, "tin nhắn");
                // Chuyển đổi dữ liệu từ DB sang định dạng state `messages`
                const loadedMessages = data.map(dbMsg => ({
                    id: dbMsg.id,
                    text: dbMsg.message, // Map 'message' sang 'text'
                    sender: dbMsg.sender, // 'user' hoặc 'ai'
                    timestamp: new Date(dbMsg.created_at), // Chuyển đổi timestamp
                }));
                // Đảo ngược lại để hiển thị đúng thứ tự trong FlatList `inverted`
                setMessages(loadedMessages.reverse());
            }
        } catch (err) {
            console.error("Lỗi không mong muốn khi tải lịch sử:", err);
            Alert.alert("Lỗi", "Đã có lỗi xảy ra khi tải dữ liệu.");
        } finally {
            setIsLoadingHistory(false); // Luôn ẩn loading sau khi kết thúc
        }
    };

    loadChatHistory();
    // Chỉ chạy lại khi user.id thay đổi (ví dụ: login/logout)
  }, [user?.id]);
  // --- Kết thúc load lịch sử chat ---


  // Hàm xử lý khi người dùng gửi tin nhắn
  const handleSend = useCallback(async () => {
    const userMessageText = inputText.trim();
    if (!userMessageText || !user?.id) return; // Không gửi nếu rỗng hoặc chưa có user

    setIsLoading(true); // Bắt đầu loading AI (loading lịch sử là riêng)
    setInputText(''); // Xóa input ngay

    // 1. Tạo tin nhắn người dùng
    const userMessage = {
      id: `user-${Date.now()}-${Math.random()}`,
      text: userMessageText,
      sender: 'user',
      timestamp: new Date(),
    };

    // Cập nhật UI trước
    setMessages(prevMessages => [userMessage, ...prevMessages]);

    // *** LƯU TIN NHẮN NGƯỜI DÙNG VÀO DB ***
    await saveMessageToDb(userMessage);
    // *** KẾT THÚC LƯU ***

    // 2. Chuẩn bị lịch sử chat cho API
    const chatHistoryForApi = messages
        .slice(0, 10) // Lấy 10 tin nhắn gần nhất từ state hiện tại
        .reverse()
        .map(msg => ({ text: msg.text, sender: msg.sender }));

    // 3. Gọi API AI
    const aiResponseText = await callAiApi(userMessageText, chatHistoryForApi);

    // 4. Tạo tin nhắn của AI
    const aiMessage = {
      id: `ai-${Date.now()}-${Math.random()}`,
      text: aiResponseText,
      sender: 'ai',
      timestamp: new Date(),
    };

    // Cập nhật UI với tin nhắn AI
    setMessages(prevMessages => [aiMessage, ...prevMessages]);

    // *** LƯU TIN NHẮN AI VÀO DB ***
    await saveMessageToDb(aiMessage);
    // *** KẾT THÚC LƯU ***

    setIsLoading(false); // Kết thúc loading AI
  }, [inputText, messages, user?.id, saveMessageToDb]); // Thêm user?.id và saveMessageToDb vào dependencies


  // Hàm render mỗi item tin nhắn trong FlatList
  const renderMessageItem = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === 'user' ? styles.userMessage : styles.aiMessage,
      ]}
    >
      {/* Thêm phân biệt màu chữ nếu muốn */}
      <Text style={[styles.messageText, item.sender === 'user' ? styles.userMessageText : styles.aiMessageText]}>
          {item.text}
      </Text>
    </View>
  );

  // --- Render chính ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="ChatBot" />
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Hiển thị loading khi tải lịch sử */}
        {isLoadingHistory && (
             <View style={styles.historyLoadingContainer}>
                 <ActivityIndicator size="large" color="#007AFF" />
                 <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
             </View>
        )}

        {/* Chỉ hiển thị FlatList khi đã load xong lịch sử */}
        {!isLoadingHistory && (
            <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id}
            style={styles.messageList}
            inverted // Quan trọng để hiển thị đúng và tự cuộn
            contentContainerStyle={styles.messageListContent}
            />
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
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#999"
            multiline
            editable={!isLoading && !isLoadingHistory} // Không cho nhập khi đang load
          />
          <TouchableOpacity
             style={[
                 styles.sendButton,
                 (isLoading || isLoadingHistory || inputText.trim().length === 0) && styles.sendButtonDisabled
             ]}
             onPress={handleSend}
             disabled={isLoading || isLoadingHistory || inputText.trim().length === 0}
           >
             <Ionicons name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


// StyleSheet (Thêm style cho loading history và màu chữ)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
  },
  // Style cho loading history (hiển thị ở giữa màn hình)
  historyLoadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
    // Màu chữ mặc định không cần thiết nếu đã set riêng
  },
  userMessageText: {
      color: '#FFFFFF', // Chữ trắng cho tin nhắn người dùng
  },
  aiMessageText: {
      color: '#000000', // Chữ đen cho tin nhắn AI
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
    paddingVertical: Platform.OS === 'ios' ? 10 : 8, // Điều chỉnh padding cho phù hợp
    fontSize: 16,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
      backgroundColor: '#B0C4DE',
  },
  loadingContainer: { // Loading của AI (thường ở trên input)
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF', // Cùng màu nền với input container
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default ChatScreen;