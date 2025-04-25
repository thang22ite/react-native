import { supabase } from "../lib/supabase";
import { uploadFile } from "./imageService";

export const createOrUpdatePost = async (post)=>{
    try{
        // upload image
        if(post.file && typeof post.file == 'object'){
            let isImage = post?.file?.type == 'image';
            let folderName = isImage? 'postImages': 'postVideos';
            let fileResult = await uploadFile(folderName, post?.file?.uri, isImage);
            if(fileResult.success) post.file = fileResult.data;
            else{
                return fileResult;
            }
        }

        const {data, error} = await supabase
        .from('posts')
        .upsert(post)
        .select()
        .single();

        if(error){
            console.log('create post error: ', error);
            return {success: false, msg: 'Could not create your post'};
        }
        return {success: true, data: data};
        
    }catch(error){
        console.log('create post error: ', error);
        return {success: false, msg: 'Could not create your post'};
    }
}

export const fetchPosts = async (limit=10, userId)=>{
    try{
        if(userId){
            const {data, error} = await supabase
            .from('posts')
            .select(`
                *,
                user: users (id, name, image),
                postLikes (*),
                comments (count)
                `)
            .order('created_at', {ascending: false})
            .eq('userId', userId)
            .limit(limit);

            if(error){
                console.log('fetchPosts error: ', error);
                return {success: false, msg: 'Could not fetch the posts'};
            }

            return {success: true, data:data};
        }else{
            const {data, error} = await supabase
            .from('posts')
            .select(`
                *,
                user: users (id, name, image),
                postLikes (*),
                comments (count)
                `)
            .order('created_at', {ascending: false})
            .limit(limit);

            if(error){
                console.log('fetchPosts error: ', error);
                return {success: false, msg: 'Could not fetch the posts'};
            }

            return {success: true, data:data};
        }
        
    }catch(error){
        console.log('fetchPosts error: ', error);
        return {success: false, msg: 'Could not fetch the posts'};
    }
}

export const createPostLike = async (postLike)=>{
    try{
        const {data, error} = await supabase
        .from('postLikes')
        .insert(postLike)
        .select()
        .single();

        if(error){
            console.log('postLike error: ', error);
            return {success: false, msg: 'Could not like the post'};
        }

        return {success: true, data:data};
        
    }catch(error){
        console.log('postLike error: ', error);
        return {success: false, msg: 'Could not like the post'};
    }
}

export const removePostLike = async (postId, userId)=>{
    try{
        const {error} = await supabase
        .from('postLikes')
        .delete()
        .eq('userId', userId)
        .eq('postId', postId)

        if(error){
            console.log('postLike error: ', error);
            return {success: false, msg: 'Could not remove the post like'};
        }

        return {success: true};
        
    }catch(error){
        console.log('postLike error: ', error);
        return {success: false, msg: 'Could not remove the post like'};
    }
}

export const fetchPostetails = async (postId)=>{
    try{
        const {data, error} = await supabase
        .from('posts')
        .select(`
            *,
            user: users (id, name, image),
            postLikes (*),
            comments (*, user: users(id, name, image))
            `)
        .eq('id', postId)
        .order("created_at", {ascending: false, foreignTable: 'comments'})
        .single();

        if(error){
            console.log('fetchPostDetails error: ', error);
            return {success: false, msg: 'Could not fetch the post'};
        }

        return {success: true, data:data};
        
    }catch(error){
        console.log('fetchPostDetails error: ', error);
        return {success: false, msg: 'Could not fetch the post'};
    }
}


export const oldcreateComment = async (comment)=>{
    try{
        const {data, error} = await supabase
        .from('comments')
        .insert(comment)
        .select()
        .single();

        if(error){
            console.log('comment error: ', error);
            return {success: false, msg: 'Could not create your comment'};
        }

        return {success: true, data:data};
        
    }catch(error){
        console.log('comment error: ', error);
        return {success: false, msg: 'Could not create your comment'};
    }
}

export const createComment = async (comment) => {
    // --- BẮT ĐẦU: Kiểm tra tính độc hại ---
    // URL của API dự đoán độc hại của bạn
    // !!! QUAN TRỌNG: Thay thế bằng URL thực tế của API Flask đang chạy của bạn
    // Ví dụ: '' nếu chạy cục bộ
    // Hoặc URL đã triển khai của bạn
    const API_URL = 'http://192.168.102.104:5000/predict'; // Sử dụng biến môi trường hoặc mặc định

    // Giả sử đối tượng 'comment' có một trường chứa văn bản, ví dụ: 'text'
    // Nếu tên trường khác, hãy điều chỉnh 'comment.text' cho phù hợp
    const commentText = comment?.text;

    if (!commentText || typeof commentText !== 'string' || !commentText.trim()) {
        console.log('Comment text is empty or invalid, skipping toxicity check.');
    } else {
        // Chỉ gọi API nếu có nội dung bình luận
        try {
            console.log(`Sending to toxicity API (${API_URL}):`, commentText);
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ comment: commentText }), // Gửi dữ liệu đúng định dạng API mong đợi
            });

            if (!response.ok) {
                // Xử lý lỗi nếu API không thành công (ví dụ: API bị lỗi, không chạy)
                // Quyết định: Chặn bình luận (an toàn hơn) hay cho phép (rủi ro)?
                // Ở đây, chúng ta sẽ chặn bình luận để đảm bảo an toàn.
                console.error('Toxicity API request failed:', response.status, response.statusText);
                const errorBody = await response.text(); // Cố gắng đọc nội dung lỗi từ API nếu có
                console.error('Toxicity API error body:', errorBody);
                return { success: false, msg: 'Could not verify comment content. Please try again later.' };
            }

            const result = await response.json();
            console.log('Toxicity API response:', result);

            // Kiểm tra xem API có trả về mảng 'labels' không
            if (result && Array.isArray(result.labels)) {
                 // Nếu mảng 'labels' không rỗng, nghĩa là bình luận bị gắn cờ độc hại
                 if (result.labels.length > 0) {
                    console.log('Toxic comment detected:', result.labels);
                    // Trả về lỗi, ngăn không cho bình luận được tạo
                    return { success: false, msg: 'hệ thống nhận thấy bạn có ngôn từ thiếu chuẩn mực, xin vui lòng kiềm chế' };
                 }
                 // Nếu mảng 'labels' rỗng, bình luận được coi là an toàn
            } else {
                 // Định dạng phản hồi không mong đợi từ API
                 console.error('Unexpected response format from toxicity API:', result);
                 // Chặn bình luận để đảm bảo an toàn
                 return { success: false, msg: 'Could not verify comment content due to an unexpected response. Please try again later.' };
            }

        } catch (error) {
            // Xử lý lỗi mạng hoặc lỗi khác khi gọi API
            console.error('Error calling toxicity API:', error);
            // Chặn bình luận để đảm bảo an toàn
            return { success: false, msg: 'Could not verify comment content due to a network error. Please try again later.' };
        }
    }
    // --- KẾT THÚC: Kiểm tra tính độc hại ---

    // --- Nếu mã chạy đến đây, bình luận được coi là KHÔNG độc hại HOẶC bình luận trống/không hợp lệ ---
    // Tiếp tục với logic lưu bình luận vào Supabase
    try {
        const { data, error } = await supabase
            .from('comments')
            .insert(comment) // Lưu đối tượng bình luận gốc
            .select()
            .single();

        if (error) {
            console.log('Supabase comment insert error: ', error);
            // Cân nhắc xem có nên hiển thị lỗi cụ thể của Supabase không
            // Ví dụ: lỗi do vi phạm ràng buộc duy nhất, v.v.
            return { success: false, msg: 'Could not create your comment. Database error.' };
        }

        // Bình luận đã được tạo thành công trong Supabase
        return { success: true, data: data };

    } catch (error) {
        // Lỗi không mong muốn khác trong quá trình tương tác với Supabase
        console.log('Unexpected comment creation error: ', error);
        return { success: false, msg: 'Could not create your comment due to an unexpected error.' };
    }
};

export const removeComment = async (commentId)=>{
    try{
        const {error} = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

        if(error){
            console.log('removeComment error: ', error);
            return {success: false, msg: 'Could not remove the comment'};
        }

        return {success: true, data: {commentId}};
        
    }catch(error){
        console.log('removeComment error: ', error);
        return {success: false, msg: 'Could not remove the comment'};
    }
}

export const removePost = async (postId)=>{
    try{
        const {error} = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

        if(error){
            console.log('removePost error: ', error);
            return {success: false, msg: 'Could not remove the post'};
        }

        return {success: true, data: {postId}};
        
    }catch(error){
        console.log('removePost error: ', error);
        return {success: false, msg: 'Could not remove the post'};
    }
}