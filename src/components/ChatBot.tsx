import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface ChatBotProps {
  user: any;
}

export const ChatBot = ({ user }: ChatBotProps) => {
  const navigate = useNavigate();

  const handleOpenChat = () => {
    navigate('/chat');
  };

  return (
    <Button
      onClick={handleOpenChat}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-glow hover:shadow-glow-strong transition-all duration-300 z-50"
      size="icon"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
};