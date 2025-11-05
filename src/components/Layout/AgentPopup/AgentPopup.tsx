import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Button,
  ScrollShadow,
  Avatar,
  Card,
  CardBody,
  Textarea,
  Badge,
  Image,
  Tooltip,
  cn,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import MessageCard from "./components/AgentMessage";

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string; // base64 data URL
  isImage: boolean;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "agent";
  timestamp: Date;
  status?: "success" | "failed";
  attempts?: number;
  currentAttempt?: number;
  attachments?: FileAttachment[];
}

interface AgentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  isFullscreen?: boolean;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export default function AgentPopup({
  isOpen,
  onClose,
  isFullscreen: isFullscreenProp = false,
  onFullscreenChange,
}: AgentPopupProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      sender: "agent",
      timestamp: new Date(),
    },
  ]);
  const [prompt, setPrompt] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const isFullscreen = isFullscreenProp;
  const setIsFullscreen = (value: boolean) => {
    if (onFullscreenChange) {
      onFullscreenChange(value);
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const attachment: FileAttachment = {
          id: `${Date.now()}-${Math.random()}`,
          name: file.name,
          type: file.type,
          size: file.size,
          url: reader.result as string,
          isImage: file.type.startsWith("image/"),
        };
        setAttachments((prev) => [...prev, attachment]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input per permettere di selezionare lo stesso file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleSendMessage = () => {
    if (!prompt.trim() && attachments.length === 0) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: prompt,
      sender: "user",
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    setMessages((prev) => [...prev, newMessage]);
    setPrompt("");
    setAttachments([]);
    setIsTyping(true);

    // Simula una risposta dell'agente dopo un breve ritardo
    setTimeout(() => {
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Ho ricevuto il tuo messaggio con gli allegati. Sto elaborando la tua richiesta...",
        sender: "agent",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const onRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (type: string): string => {
    if (type.startsWith("image/")) return "solar:gallery-bold";
    if (type.includes("pdf")) return "solar:file-text-bold";
    if (type.includes("word") || type.includes("document"))
      return "solar:document-bold";
    if (type.includes("sheet") || type.includes("excel"))
      return "solar:chart-square-bold";
    if (type.includes("zip") || type.includes("rar"))
      return "solar:folder-with-files-bold";
    return "solar:file-bold";
  };

  return (
    <AnimatePresence>
      {isOpen && !isFullscreen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed right-0 top-0 h-full w-96 py-4 pr-4 z-50 flex"
        >
          <div className="border-l-small border border-primary/20 relative flex h-full w-full flex-col p-6 bg-default-50 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-foreground flex h-8 w-8 items-center justify-center rounded-full">
                  <Icon
                    icon="solar:chat-round-dots-bold"
                    width={18}
                    className="text-background"
                  />
                </div>
                <span className="text-small font-bold uppercase">
                  Andromeda AI
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  isIconOnly
                  size="sm"
                  radius="full"
                  variant="light"
                  onPress={() => setIsFullscreen(!isFullscreen)}
                  className="text-default-500 data-[hover=true]:text-foreground"
                  title={
                    isFullscreen
                      ? "Riduci a pannello laterale"
                      : "Espandi a schermo intero"
                  }
                >
                  <Icon
                    icon={
                      isFullscreen
                        ? "solar:minimize-square-2-line-duotone"
                        : "solar:maximize-square-2-line-duotone"
                    }
                    width={20}
                  />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  radius="full"
                  variant="light"
                  onPress={onClose}
                  className="text-default-500 data-[hover=true]:text-foreground"
                >
                  <Icon icon="solar:close-circle-line-duotone" width={20} />
                </Button>
              </div>
            </div>

            <div className="h-6" />

            {/* Chat Messages */}
            <ScrollShadow className="-mx-6 h-full max-h-full px-6 py-2 flex-1">
              {messages.map((message) =>
                message.sender === "agent" ? (
                  <MessageCard
                    key={message.id}
                    text={message.text}
                    timestamp={message.timestamp}
                  />
                ) : (
                  <div
                    key={message.id}
                    className={`flex justify-end ${
                      message.attachments && message.attachments.length > 0
                        ? "mb-6 mt-6"
                        : "mb-6 mt-4"
                    }`}
                  >
                    <div className="flex gap-3 w-full flex-row-reverse">
                      <Avatar
                        size="md"
                        src="https://i.pravatar.cc/150?u=a04258114e29026708c"
                        className="flex-shrink-0"
                      />
                      <div className="flex flex-col gap-2">
                        {message.attachments &&
                          message.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {message.attachments.map((attachment) =>
                                attachment.isImage ? (
                                  <Image
                                    key={attachment.id}
                                    alt={attachment.name}
                                    className="rounded-medium border-small border-primary/20 max-w-[200px] max-h-[200px] object-cover"
                                    src={attachment.url}
                                  />
                                ) : (
                                  <Card
                                    key={attachment.id}
                                    className="bg-primary-50 border-small border-primary/20"
                                  >
                                    <CardBody className="p-2 flex flex-row items-center gap-2">
                                      <Icon
                                        icon={getFileIcon(attachment.type)}
                                        width={24}
                                        className="text-primary flex-shrink-0"
                                      />
                                      <div className="flex flex-col min-w-0">
                                        <p className="text-tiny font-medium text-foreground truncate max-w-[120px]">
                                          {attachment.name}
                                        </p>
                                        <p className="text-tiny text-default-400">
                                          {formatFileSize(attachment.size)}
                                        </p>
                                      </div>
                                    </CardBody>
                                  </Card>
                                )
                              )}
                            </div>
                          )}
                        <Card className="bg-primary text-primary-foreground">
                          <CardBody className="p-3">
                            {message.text && (
                              <p className="text-small">{message.text}</p>
                            )}
                            <p className="text-tiny mt-1 text-primary-foreground/60">
                              {message.timestamp.toLocaleTimeString("it-IT", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </CardBody>
                        </Card>
                      </div>
                    </div>
                  </div>
                )
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <Avatar
                      icon={
                        <Icon
                          icon="solar:smartphone-2-bold-duotone"
                          width={20}
                        />
                      }
                      size="md"
                      classNames={{
                        base: "bg-foreground flex-shrink-0",
                        icon: "text-background",
                      }}
                    />
                    <Card className="bg-default-100">
                      <CardBody className="p-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-default-400 rounded-full animate-bounce" />
                          <span
                            className="w-2 h-2 bg-default-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          />
                          <span
                            className="w-2 h-2 bg-default-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          />
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                </div>
              )}
            </ScrollShadow>

            {/* Input Area */}
            <form className="mt-auto rounded-xl bg-default-100 hover:bg-default-200/70 flex w-full flex-col items-start transition-all duration-200 shadow-sm border border-default-200/50">
              {attachments.length > 0 && (
                <div className="w-full px-4 pt-4 pb-2">
                  <div className="group flex flex-wrap gap-3">
                    {attachments.map((attachment) => (
                      <Badge
                        key={attachment.id}
                        isOneChar
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        content={
                          <Button
                            isIconOnly
                            radius="full"
                            size="sm"
                            variant="light"
                            className="bg-danger/90 text-white"
                            onPress={() => onRemoveAttachment(attachment.id)}
                          >
                            <Icon
                              className="text-white"
                              icon="solar:close-circle-bold"
                              width={18}
                            />
                          </Button>
                        }
                      >
                        {attachment.isImage ? (
                          <div className="relative group/image">
                            <Image
                              alt={attachment.name}
                              className="rounded-lg border-2 border-default-200 h-20 w-20 object-cover hover:border-primary transition-colors cursor-pointer"
                              src={attachment.url}
                            />
                          </div>
                        ) : (
                          <Card className="h-20 w-20 hover:scale-105 transition-transform cursor-pointer border-2 border-default-200 hover:border-primary">
                            <CardBody className="p-0 flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-primary/10 to-primary/5">
                              <Icon
                                icon={getFileIcon(attachment.type)}
                                width={28}
                                className="text-primary"
                              />
                              <p className="text-[8px] font-medium text-default-600 truncate w-full text-center px-1">
                                {attachment.name.length > 10
                                  ? attachment.name.substring(0, 10) + "..."
                                  : attachment.name}
                              </p>
                            </CardBody>
                          </Card>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="w-full px-3 pb-3">
                <div className="flex items-start gap-2">
                  <Tooltip showArrow content="Allega File">
                    <Button
                      isIconOnly
                      radius="full"
                      size="sm"
                      variant="light"
                      className="mt-1 hover:bg-default-200 transition-colors"
                      onPress={handleGalleryClick}
                    >
                      <Icon
                        className="text-default-600"
                        icon="solar:paperclip-2-bold-duotone"
                        width={22}
                      />
                    </Button>
                  </Tooltip>
                  <div className="flex-1 relative">
                    <Textarea
                      classNames={{
                        inputWrapper: "bg-transparent shadow-none px-0",
                        innerWrapper: "relative",
                        input: "text-medium pr-24",
                      }}
                      minRows={3}
                      maxRows={8}
                      radius="lg"
                      value={prompt}
                      variant="flat"
                      onValueChange={setPrompt}
                      placeholder="Scrivi un messaggio..."
                    />
                    <div className="absolute right-2 bottom-2 flex items-center gap-2">
                      <p className="text-tiny text-default-400 select-none">
                        {prompt.length}/2000
                      </p>
                      <Tooltip showArrow content="Invia messaggio">
                        <Button
                          isIconOnly
                          color={
                            !prompt && attachments.length === 0
                              ? "default"
                              : "primary"
                          }
                          isDisabled={!prompt && attachments.length === 0}
                          radius="lg"
                          size="sm"
                          variant="solid"
                          className="shadow-md"
                          onPress={handleSendMessage}
                        >
                          <Icon
                            className={cn(
                              "[&>path]:stroke-[2px]",
                              !prompt && attachments.length === 0
                                ? "text-default-600"
                                : "text-primary-foreground"
                            )}
                            icon="solar:arrow-up-linear"
                            width={20}
                          />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="*/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </form>
          </div>
        </motion.div>
      )}
      {isOpen && isFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsFullscreen(false)}
          />
          <div className="border-l-small border border-primary/20 relative flex h-full w-full max-w-6xl z-10 flex-col p-6 bg-default-50 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-foreground flex h-8 w-8 items-center justify-center rounded-full">
                  <Icon
                    icon="solar:chat-round-dots-bold"
                    width={18}
                    className="text-background"
                  />
                </div>
                <span className="text-small font-bold uppercase">
                  Andromeda AI
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  isIconOnly
                  size="sm"
                  radius="full"
                  variant="light"
                  onPress={() => setIsFullscreen(!isFullscreen)}
                  className="text-default-500 data-[hover=true]:text-foreground"
                  title={
                    isFullscreen
                      ? "Riduci a pannello laterale"
                      : "Espandi a schermo intero"
                  }
                >
                  <Icon
                    icon={
                      isFullscreen
                        ? "solar:minimize-square-2-line-duotone"
                        : "solar:maximize-square-2-line-duotone"
                    }
                    width={20}
                  />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  radius="full"
                  variant="light"
                  onPress={onClose}
                  className="text-default-500 data-[hover=true]:text-foreground"
                >
                  <Icon icon="solar:close-circle-line-duotone" width={20} />
                </Button>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 px-2 mt-4">
              <div className="w-2 h-2 bg-success rounded-full" />
              <p className="text-tiny text-default-400">
                Online e pronto ad aiutarti
              </p>
            </div>

            <div className="h-6" />

            {/* Chat Messages */}
            <ScrollShadow className="-mx-6 h-full max-h-full px-6 py-2 flex-1">
              {messages.map((message) =>
                message.sender === "agent" ? (
                  <MessageCard
                    key={message.id}
                    text={message.text}
                    timestamp={message.timestamp}
                  />
                ) : (
                  <div
                    key={message.id}
                    className={`flex justify-end ${
                      message.attachments && message.attachments.length > 0
                        ? "mb-6 mt-6"
                        : "mb-6 mt-4"
                    }`}
                  >
                    <div className="flex gap-3 w-full flex-row-reverse">
                      <Avatar
                        size="md"
                        src="https://i.pravatar.cc/150?u=a04258114e29026708c"
                        className="flex-shrink-0"
                      />
                      <div className="flex flex-col gap-2">
                        {message.attachments &&
                          message.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {message.attachments.map((attachment) =>
                                attachment.isImage ? (
                                  <Image
                                    key={attachment.id}
                                    alt={attachment.name}
                                    className="rounded-medium border-small border-primary/20 max-w-[200px] max-h-[200px] object-cover"
                                    src={attachment.url}
                                  />
                                ) : (
                                  <Card
                                    key={attachment.id}
                                    className="bg-primary-50 border-small border-primary/20"
                                  >
                                    <CardBody className="p-2 flex flex-row items-center gap-2">
                                      <Icon
                                        icon={getFileIcon(attachment.type)}
                                        width={24}
                                        className="text-primary flex-shrink-0"
                                      />
                                      <div className="flex flex-col min-w-0">
                                        <p className="text-tiny font-medium text-foreground truncate max-w-[120px]">
                                          {attachment.name}
                                        </p>
                                        <p className="text-tiny text-default-400">
                                          {formatFileSize(attachment.size)}
                                        </p>
                                      </div>
                                    </CardBody>
                                  </Card>
                                )
                              )}
                            </div>
                          )}
                        <Card className="bg-primary text-primary-foreground">
                          <CardBody className="p-3">
                            {message.text && (
                              <p className="text-small">{message.text}</p>
                            )}
                            <p className="text-tiny mt-1 text-primary-foreground/60">
                              {message.timestamp.toLocaleTimeString("it-IT", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </CardBody>
                        </Card>
                      </div>
                    </div>
                  </div>
                )
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <Avatar
                      icon={
                        <Icon
                          icon="solar:smartphone-2-bold-duotone"
                          width={20}
                        />
                      }
                      size="md"
                      classNames={{
                        base: "bg-foreground flex-shrink-0",
                        icon: "text-background",
                      }}
                    />
                    <Card className="bg-default-100">
                      <CardBody className="p-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-default-400 rounded-full animate-bounce" />
                          <span
                            className="w-2 h-2 bg-default-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          />
                          <span
                            className="w-2 h-2 bg-default-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          />
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                </div>
              )}
            </ScrollShadow>

            {/* Input Area */}
            <form className="mt-auto rounded-xl bg-default-100 hover:bg-default-200/70 flex w-full flex-col items-start transition-all duration-200 shadow-sm border border-default-200/50">
              {attachments.length > 0 && (
                <div className="w-full px-4 pt-4 pb-2">
                  <div className="group flex flex-wrap gap-3">
                    {attachments.map((attachment) => (
                      <Badge
                        key={attachment.id}
                        isOneChar
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        content={
                          <Button
                            isIconOnly
                            radius="full"
                            size="sm"
                            variant="light"
                            className="bg-danger/90 text-white"
                            onPress={() => onRemoveAttachment(attachment.id)}
                          >
                            <Icon
                              className="text-white"
                              icon="solar:close-circle-bold"
                              width={18}
                            />
                          </Button>
                        }
                      >
                        {attachment.isImage ? (
                          <div className="relative group/image">
                            <Image
                              alt={attachment.name}
                              className="rounded-lg border-2 border-default-200 h-20 w-20 object-cover hover:border-primary transition-colors cursor-pointer"
                              src={attachment.url}
                            />
                          </div>
                        ) : (
                          <Card className="h-20 w-20 hover:scale-105 transition-transform cursor-pointer border-2 border-default-200 hover:border-primary">
                            <CardBody className="p-0 flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-primary/10 to-primary/5">
                              <Icon
                                icon={getFileIcon(attachment.type)}
                                width={28}
                                className="text-primary"
                              />
                              <p className="text-[8px] font-medium text-default-600 truncate w-full text-center px-1">
                                {attachment.name.length > 10
                                  ? attachment.name.substring(0, 10) + "..."
                                  : attachment.name}
                              </p>
                            </CardBody>
                          </Card>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <Textarea
                classNames={{
                  inputWrapper: "bg-transparent shadow-none",
                  innerWrapper: "relative",
                  input: "pt-1 pb-6 pr-10 text-medium",
                }}
                endContent={
                  <div className="absolute right-0 flex h-full flex-col items-end justify-between gap-2">
                    <div className="flex items-end gap-2">
                      <p className="text-tiny text-default-400 py-1">
                        {prompt.length}/2000
                      </p>
                      <Tooltip showArrow content="Invia messaggio">
                        <Button
                          isIconOnly
                          color={!prompt ? "default" : "primary"}
                          isDisabled={!prompt}
                          radius="lg"
                          size="sm"
                          variant="solid"
                          onPress={handleSendMessage}
                        >
                          <Icon
                            className={cn(
                              "[&>path]:stroke-[2px]",
                              !prompt
                                ? "text-default-600"
                                : "text-primary-foreground"
                            )}
                            icon="solar:arrow-up-linear"
                            width={20}
                          />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                }
                minRows={3}
                radius="lg"
                startContent={
                  <Tooltip showArrow content="Allega File">
                    <Button
                      isIconOnly
                      radius="full"
                      size="sm"
                      variant="light"
                      onPress={handleGalleryClick}
                    >
                      <Icon
                        className="text-default-500"
                        icon="solar:paperclip-2-linear"
                        width={20}
                      />
                    </Button>
                  </Tooltip>
                }
                value={prompt}
                variant="flat"
                onValueChange={setPrompt}
                placeholder="Scrivi un messaggio..."
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="*/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Componente Toggle Button da posizionare nel layout
export function AgentToggleButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      isIconOnly
      color="primary"
      className="fixed bottom-6 right-6 z-40 shadow-lg w-14 h-14"
      onPress={onClick}
    >
      <Icon icon="solar:chat-round-dots-bold" width={28} />
    </Button>
  );
}
