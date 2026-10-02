
import {
  ArrowLeft,
  Check,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  Smile,
  Video,
} from "lucide-react";
import { useState } from "react";

const conversations = [
  {
    id: 1,
    name: "Rahul",
    username: "@rahul",
    avatar: "R",
    online: true,
    lastMessage: "That movie was insane 🔥",
    time: "10:42 AM",
  },
  {
    id: 2,
    name: "Movie Club",
    username: "@movieclub",
    avatar: "M",
    online: false,
    lastMessage: "New recommendations?",
    time: "Yesterday",
  },
  {
    id: 3,
    name: "Arjun",
    username: "@arjun",
    avatar: "A",
    online: false,
    lastMessage: "Let's watch it tonight.",
    time: "Mon",
  },
];

const initialMessages = [
  {
    id: 1,
    sender: "other",
    text: "Bro, have you watched Interstellar?",
    time: "10:38 AM",
  },
  {
    id: 2,
    sender: "me",
    text: "Yeah! One of my favourites.",
    time: "10:39 AM",
  },
  {
    id: 3,
    sender: "other",
    text: "That movie was insane 🔥",
    time: "10:42 AM",
  },
];

const Chat = () => {
  const [selectedChat, setSelectedChat] = useState(
    conversations[0]
  );

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] =
    useState(initialMessages);

  const filteredConversations =
    conversations.filter((conversation) => {
      const query = search.trim().toLowerCase();

      if (!query) {
        return true;
      }

      return (
        conversation.name
          .toLowerCase()
          .includes(query) ||
        conversation.username
          .toLowerCase()
          .includes(query)
      );
    });

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: Date.now(),
        sender: "me",
        text: trimmedMessage,
        time: "Now",
      },
    ]);

    setMessage("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    handleSendMessage();
  };

  return (
    <main className="min-h-screen bg-black px-3 pb-4 pt-24 text-white sm:px-5 sm:pt-28 lg:px-8 lg:pt-32">
      <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-[1500px] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">

        {/* =========================
            CONVERSATION SIDEBAR
        ========================= */}

        <aside
          className={`w-full shrink-0 border-r border-white/10 bg-black/40 md:w-[330px] lg:w-[360px] ${
            selectedChat ? "hidden md:block" : "block"
          }`}
        >

          {/* SIDEBAR HEADER */}

          <div className="border-b border-white/10 p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                  CineMate
                </p>

                <h1 className="mt-1 text-2xl font-bold">
                  Messages
                </h1>
              </div>

              <button
                type="button"
                aria-label="Chat options"
                className="rounded-full p-2 text-white/40 transition hover:bg-white/5 hover:text-white"
              >
                <MoreVertical size={19} />
              </button>

            </div>

            {/* SEARCH */}

            <div className="mt-5 flex h-11 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3">
              <Search
                size={17}
                className="shrink-0 text-white/30"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search conversations..."
                aria-label="Search conversations"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
              />

            </div>

          </div>

          {/* CONVERSATION LIST */}

          <div className="h-[calc(100%-145px)] overflow-y-auto">

            {filteredConversations.length > 0 ? (
              filteredConversations.map(
                (conversation) => {
                  const active =
                    selectedChat?.id ===
                    conversation.id;

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() =>
                        setSelectedChat(
                          conversation
                        )
                      }
                      className={`flex w-full items-center gap-3 border-b border-white/5 px-5 py-4 text-left transition ${
                        active
                          ? "bg-white/[0.08]"
                          : "hover:bg-white/[0.04]"
                      }`}
                    >

                      {/* AVATAR */}

                      <div className="relative shrink-0">

                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-sm font-semibold">
                          {conversation.avatar}
                        </div>

                        {conversation.online && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-black bg-white" />
                        )}

                      </div>

                      {/* INFO */}

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center justify-between gap-3">

                          <p className="truncate text-sm font-semibold">
                            {conversation.name}
                          </p>

                          <span className="shrink-0 text-[10px] text-white/25">
                            {conversation.time}
                          </span>

                        </div>

                        <p className="mt-1 truncate text-xs text-white/35">
                          {conversation.lastMessage}
                        </p>

                      </div>

                    </button>
                  );
                }
              )
            ) : (
              <div className="px-6 py-12 text-center">

                <Search
                  size={28}
                  className="mx-auto text-white/15"
                />

                <p className="mt-4 text-sm text-white/35">
                  No conversations found.
                </p>

              </div>
            )}

          </div>

        </aside>

        {/* =========================
            ACTIVE CHAT
        ========================= */}

        <section
          className={`flex min-w-0 flex-1 flex-col ${
            selectedChat
              ? "flex"
              : "hidden md:flex"
          }`}
        >

          {/* CHAT HEADER */}

          <header className="flex min-h-[76px] items-center justify-between border-b border-white/10 bg-black/40 px-4 sm:px-6">

            <div className="flex min-w-0 items-center gap-3">

              {/* MOBILE BACK */}

              <button
                type="button"
                onClick={() =>
                  setSelectedChat(null)
                }
                aria-label="Back to conversations"
                className="rounded-full p-2 text-white/50 transition hover:bg-white/5 hover:text-white md:hidden"
              >
                <ArrowLeft size={19} />
              </button>

              {/* AVATAR */}

              <div className="relative shrink-0">

                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-sm font-semibold">
                  {selectedChat?.avatar || "?"}
                </div>

                {selectedChat?.online && (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-black bg-white" />
                )}

              </div>

              <div className="min-w-0">

                <p className="truncate text-sm font-semibold">
                  {selectedChat?.name || "Select a chat"}
                </p>

                <p className="mt-0.5 text-xs text-white/30">
                  {selectedChat?.online
                    ? "Online"
                    : "Offline"}
                </p>

              </div>

            </div>

            <div className="flex items-center gap-1">

              <button
                type="button"
                aria-label="Start voice call"
                className="rounded-full p-2.5 text-white/40 transition hover:bg-white/5 hover:text-white"
              >
                <Phone size={18} />
              </button>

              <button
                type="button"
                aria-label="Start video call"
                className="rounded-full p-2.5 text-white/40 transition hover:bg-white/5 hover:text-white"
              >
                <Video size={19} />
              </button>

              <button
                type="button"
                aria-label="More chat options"
                className="hidden rounded-full p-2.5 text-white/40 transition hover:bg-white/5 hover:text-white sm:block"
              >
                <MoreVertical size={18} />
              </button>

            </div>

          </header>

          {/* MESSAGE AREA */}

          <div className="relative flex-1 overflow-y-auto px-4 py-6 sm:px-6">

            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.035),transparent_60%)]" />

            <div className="relative mx-auto flex max-w-3xl flex-col gap-3">

              <div className="mx-auto mb-4 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-[10px] uppercase tracking-[0.15em] text-white/25">
                Today
              </div>

              {messages.map((item) => {
                const isMine =
                  item.sender === "me";

                return (
                  <div
                    key={item.id}
                    className={`flex ${
                      isMine
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[70%] ${
                        isMine
                          ? "rounded-br-md bg-white text-black"
                          : "rounded-bl-md border border-white/10 bg-white/[0.06] text-white"
                      }`}
                    >

                      <p className="text-sm leading-6">
                        {item.text}
                      </p>

                      <div
                        className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${
                          isMine
                            ? "text-black/40"
                            : "text-white/25"
                        }`}
                      >
                        <span>{item.time}</span>

                        {isMine && (
                          <Check size={12} />
                        )}
                      </div>

                    </div>

                  </div>
                );
              })}

            </div>

          </div>

          {/* MESSAGE COMPOSER */}

          <form
            onSubmit={handleSubmit}
            className="border-t border-white/10 bg-black/50 p-3 sm:p-4"
          >

            <div className="mx-auto flex max-w-3xl items-center gap-2">

              <button
                type="button"
                aria-label="Add attachment"
                className="hidden shrink-0 rounded-full p-2.5 text-white/35 transition hover:bg-white/5 hover:text-white sm:block"
              >
                <Paperclip size={19} />
              </button>

              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4">

                <button
                  type="button"
                  aria-label="Add emoji"
                  className="shrink-0 text-white/30 transition hover:text-white"
                >
                  <Smile size={19} />
                </button>

                <input
                  type="text"
                  value={message}
                  onChange={(event) =>
                    setMessage(event.target.value)
                  }
                  placeholder="Type a message..."
                  aria-label="Type a message"
                  className="h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
                />

              </div>

              <button
                type="submit"
                aria-label="Send message"
                disabled={!message.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Send size={17} />
              </button>

            </div>

          </form>

        </section>

      </div>
    </main>
  );
};

export default Chat;

