import { MessageCircle } from 'lucide-react';

export default function ChatIndexPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center
                    bg-slate-900 text-slate-500">
      <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center
                      justify-center mb-4 shadow-lg">
        <MessageCircle size={36} className="text-blue-500" />
      </div>
      <h2 className="text-white text-xl font-semibold mb-2">Your Messages</h2>
      <p className="text-slate-400 text-sm text-center max-w-xs">
        Select a conversation from the sidebar or start a new chat with a contact.
      </p>
    </div>
  );
}
