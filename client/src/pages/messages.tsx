import { Header } from "@/components/layout/header";
import { MessageList } from "@/components/messaging/message-list";

export default function Messages() {
  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Messages" 
        subtitle="Secure communication with patients and staff"
      />
      
      <div className="flex-1 overflow-auto p-6">
        <MessageList />
      </div>
    </div>
  );
}
