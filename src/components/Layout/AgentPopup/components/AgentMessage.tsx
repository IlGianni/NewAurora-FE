import { useState } from "react";
import { Avatar, Card, CardBody, Button } from "@heroui/react";
import { Icon } from "@iconify/react";

interface AgentMessageProps {
  text: string;
  timestamp: Date;
}

export default function AgentMessage({ text, timestamp }: AgentMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Errore durante la copia:", err);
    }
  };

  return (
    <div className="flex gap-3 w-full">
      <Avatar
        src="https://api.dicebear.com/7.x/bottts/svg?seed=nova"
        size="md"
        radius="full"
        classNames={{
          base: "rounded-full flex-shrink-0",
          img: "rounded-full",
        }}
      />

      <Card className="bg-default-100 relative group">
        <CardBody className="p-3">
          <p className="text-small text-foreground">{text}</p>
          <div className="flex justify-between items-center">
            <p className="text-tiny mt-1 text-default-400">
              {timestamp.toLocaleTimeString("it-IT", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <Button isIconOnly size="sm" variant="light" onPress={handleCopy}>
              <Icon
                icon={copied ? "solar:check-circle-bold" : "solar:copy-linear"}
                width={16}
                className={copied ? "text-success" : "text-default-400"}
              />
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
