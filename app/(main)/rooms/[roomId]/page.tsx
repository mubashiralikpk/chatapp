'use client';
import { useParams } from 'next/navigation';
import RoomWindow from '@/components/rooms/RoomWindow';

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  return <RoomWindow roomId={roomId} />;
}
