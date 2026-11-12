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
