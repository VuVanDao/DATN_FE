import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class AiAssistantService {
  /**
   * Danh sách tin nhắn ban đầu mô phỏng hội thoại (Mock)
   */
  getInitialMessages(): AiMessage[] {
    return [
      {
        id: '1',
        role: 'assistant',
        content:
          'Chào bạn 👋 Mình là trợ lý AI của TrelloClone. Mình có thể tóm tắt sprint, tìm task trễ hạn, gợi ý phân bổ công việc hoặc tạo task mới giúp bạn.',
        timestamp: '10:45',
      },
      {
        id: '2',
        role: 'user',
        content: 'Tóm tắt Sprint 14',
        timestamp: '10:46',
      },
      {
        id: '3',
        role: 'assistant',
        content:
          'Sprint 14 đã hoàn thành <b>32/45 story points (71%)</b>. Còn 6 task ở cột Cần làm và 5 task Đang làm. Với tốc độ hiện tại, nhóm có khả năng hoàn thành đúng hạn vào ngày 16/09.',
        timestamp: '10:46',
      },
      {
        id: '4',
        role: 'user',
        content: 'Task nào đang trễ hạn?',
        timestamp: '10:48',
      },
      {
        id: '5',
        role: 'assistant',
        content:
          'Có 2 task đang quá hạn cần chú ý:<br/>• <b>BUG-201</b> "Số dư hiển thị sai sau khi refresh" (hạn 11/09)<br/>• <b>TASK-108</b> "Tích hợp xác thực OTP qua SMS" (hạn 10/09). Bạn có muốn gửi thông báo nhắc nhở người phụ trách không?',
        timestamp: '10:48',
      },
    ];
  }

  /**
   * Danh sách câu hỏi gợi ý nhanh (Prompt Chips)
   */
  getSuggestedPrompts(): string[] {
    return [
      'Tóm tắt Sprint 14',
      'Task nào đang trễ hạn?',
      'Ai đang quá tải việc?',
      'Tạo task từ mô tả',
    ];
  }

  /**
   * Gửi tin nhắn cho trợ lý AI.
   * HIỆN TẠI: Mô phỏng phản hồi (Mock) với delay 450ms.
   * TƯƠNG LAI: Dễ dàng thay thế bằng gọi HttpClient API Backend:
   * return this.http.post<AiMessage>(`${environment.apiUrl}/ai/chat`, { message });
   */
  sendMessage(message: string): Observable<AiMessage> {
    const lower = message.toLowerCase();
    let responseText = '';

    if (lower.includes('sprint') || lower.includes('tóm tắt')) {
      responseText =
        'Sprint hiện tại đang có <b>18 task</b> đang làm, <b>3 task</b> quá hạn. Tỷ lệ hoàn thành đạt <b>71%</b>. Nhóm đang giữ tiến độ rất tốt!';
    } else if (lower.includes('trễ') || lower.includes('quá hạn')) {
      responseText =
        'Hiện có <b>2 task</b> quá hạn: <b>BUG-201</b> và <b>TASK-108</b>. Ưu tiên giải quyết BUG-201 trước vì ảnh hưởng giao dịch khách hàng.';
    } else if (lower.includes('quá tải') || lower.includes('phân bổ')) {
      responseText =
        'Thành viên <b>Nam Trần</b> đang nhận 7 task (vượt 120% tải mức chuẩn). Đề xuất chuyển giao 2 task phụ cho <b>Lan Phạm</b>.';
    } else if (lower.includes('tạo task')) {
      responseText =
        'Để tạo task nhanh bằng AI, bạn chỉ cần gõ theo cú pháp: <i>"Tạo task: [Tên task] cho [Người nhận] hạn [Ngày]"</i>.';
    } else {
      responseText = `Mình đã ghi nhận yêu cầu: "<b>${message}</b>". Trợ lý AI đang phân tích dữ liệu dự án của bạn và sẽ đưa ra khuyến nghị phù hợp.`;
    }

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const reply: AiMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: responseText,
      timestamp: timeStr,
    };

    return of(reply).pipe(delay(450));
  }
}
