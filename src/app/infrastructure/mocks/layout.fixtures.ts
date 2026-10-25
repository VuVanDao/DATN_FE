/** Demo data only; these items are not backed by board APIs. */
export interface RecentBoardItem {
  id: string;
  name: string;
  color: string;
  isPinned: boolean;
}
export const DEMO_RECENT_BOARDS: RecentBoardItem[] = [
  { id: 'rb-1', name: 'App di động Fintech', color: 'bg-indigo-500', isPinned: false },
  { id: 'rb-2', name: 'Website bán hàng', color: 'bg-emerald-500', isPinned: false },
  { id: 'rb-3', name: 'Core API Service', color: 'bg-blue-500', isPinned: true },
  { id: 'rb-4', name: 'Hệ thống Quản lý Task', color: 'bg-amber-500', isPinned: true },
];

export interface NotificationItem {
  id: number;
  icon: string;
  color: string;
  text: string;
  time: string;
  unread: boolean;
}

export const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    icon: 'user-plus',
    color: 'bg-purple-500/15 text-purple-400',
    text: '<b>Trang Vũ</b> đã mời bạn tham gia không gian <b>Marketing Team</b>',
    time: '5 phút trước',
    unread: true,
  },
  {
    id: 2,
    icon: 'clipboard-check',
    color: 'bg-blue-500/15 text-blue-400',
    text: '<b>Lan Phạm</b> đã giao cho bạn task <b>TASK-142</b>',
    time: '32 phút trước',
    unread: true,
  },
  {
    id: 3,
    icon: 'at-sign',
    color: 'bg-indigo-500/15 text-indigo-400',
    text: '<b>Nam Trần</b> đã nhắc đến bạn trong bình luận của <b>BUG-201</b>',
    time: '1 giờ trước',
    unread: true,
  },
  {
    id: 4,
    icon: 'alarm-clock',
    color: 'bg-red-500/15 text-red-400',
    text: 'Task <b>BUG-201</b> sắp đến hạn vào ngày mai',
    time: '3 giờ trước',
    unread: true,
  },
];
