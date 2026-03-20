import { useState, useEffect } from "react"
import SideBarAdmin from "@/components/layout/SideBarAdmin";
import CardResponseMenu from "@/components/layout/chatbot/CardSuggestionMenu"
import BewareIcon from "@/assets/icons/beware.svg?url"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import axios from "axios"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

function mapTopicFromApi(t) {
  return {
    suggestion_topics_id: t.suggestion_topics_id,
    topic: t.topic,
    replyFormat: t.reply_format,
    replyTitle: t.reply_title ?? null,
    replyMessage: t.reply_message ?? null,
    buttonName: t.button_name ?? null,
    roomTypes: t.roomTypes ?? [],
    options: (t.options ?? []).map((o) => ({ option: o.option_text, details: o.details })),
  }
}

const ErrorMessage = () => (
  <span className="body-2 font-normal! text-red">Please fill in this field</span>
)

const ValidatedTextarea = ({ value, onChange, error, className = "", ...props }) => (
  <div>
    <div className="relative">
      <textarea
        value={value}
        onChange={onChange}
        className={`bg-white w-full border rounded-[4px] p-3 pr-10 outline-none resize-none ${error ? "border-red" : "border-gray-400"} ${className}`}
        {...props}
      />
      {error && <img src={BewareIcon} className="absolute top-3 right-3 w-6 h-6" alt="" aria-hidden />}
    </div>
    {error && <ErrorMessage />}
  </div>
)


export default function ChatbotAdmin() {
  const [greetingMessage, setGreetingMessage] = useState("")
  const [greetingError, setGreetingError] = useState(false)
  const [autoReply, setAutoReply] = useState("")
  const [autoReplyError, setAutoReplyError] = useState(false)

  const [savedGreetingMessage, setSavedGreetingMessage] = useState("")
  const [savedAutoReply, setSavedAutoReply] = useState("")

  const [cards, setCards] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [editingCount, setEditingCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [savingGreeting, setSavingGreeting] = useState(false)
  const [savingAutoReply, setSavingAutoReply] = useState(false)
  const [savingCardId, setSavingCardId] = useState(null)

  const hasGreetingChanges = greetingMessage !== savedGreetingMessage
  const hasAutoReplyChanges = autoReply !== savedAutoReply

  useEffect(() => {
    let cancelled = false
    axios
      .get("/api/chatbot/suggestions")
      .then((res) => {
        if (cancelled) return
        const { topics = [], greetingMessages = [] } = res.data?.data ?? {}
        const greeting = greetingMessages.find((m) => m.type_text === "greeting_message")
        const autoReplyMsg = greetingMessages.find((m) => m.type_text === "auto_reply_message")
        setGreetingMessage(greeting?.message ?? "")
        setSavedGreetingMessage(greeting?.message ?? "")
        setAutoReply(autoReplyMsg?.message ?? "")
        setSavedAutoReply(autoReplyMsg?.message ?? "")
        setCards(topics.map((t) => ({ id: t.suggestion_topics_id, data: mapTopicFromApi(t) })))
        setLoadError(null)
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err.response?.data?.error ?? "Failed to load")
          toast.error("Failed to load chatbot data", {
            style: {
              background: "#fee2e2",
              color: "#b91c1c",
              border: "1px solid #fca5a5",
              fontSize: "16px",
              fontWeight: "600",
            },
          })
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const handleSaveGreeting = async () => {
    if (!greetingMessage.trim()) {
      setGreetingError(true)
      return
    }
    setSavingGreeting(true)
    try {
      await axios.post("/api/chatbot/greeting-message", { message: greetingMessage })
      setSavedGreetingMessage(greetingMessage)
      toast.success("Greeting message saved", {
        style: {
          background: "#bbf7d0",
          color: "#15803d",
          border: "1px solid #86efac",
          fontSize: "16px",
          fontWeight: "600"
        }
      })
    } catch (err) {
      const msg = err.response?.data?.error ?? "Failed to save greeting message"
      toast.error(msg, {
        style: {
          background: "#fee2e2",
          color: "#b91c1c",
          border: "1px solid #fca5a5",
          fontSize: "16px",
          fontWeight: "600"
        }
      })
    } finally {
      setSavingGreeting(false)
    }
  }
  const handleCancelGreeting = () => {
    setGreetingMessage(savedGreetingMessage)
    setGreetingError(false)
  }

  const handleSaveAutoReply = async () => {
    if (!autoReply.trim()) {
      setAutoReplyError(true)
      return
    }
    setSavingAutoReply(true)
    try {
      await axios.post("/api/chatbot/auto-reply-message", { message: autoReply })
      setSavedAutoReply(autoReply)
      toast.success("Auto-reply message saved", {
        style: {
          background: "#bbf7d0",
          color: "#15803d",
          border: "1px solid #86efac",
          fontSize: "16px",
          fontWeight: "600"
        }
      })
    } catch (err) {
      const msg = err.response?.data?.error ?? "Failed to save auto-reply message"
      toast.error(msg, {
        style: {
          background: "#fee2e2",
          color: "#b91c1c",
          border: "1px solid #fca5a5",
          fontSize: "16px",
          fontWeight: "600"
        }
      })
    } finally {
      setSavingAutoReply(false)
    }
  }
  const handleCancelAutoReply = () => {
    setAutoReply(savedAutoReply)
    setAutoReplyError(false)
  }

  const handleSaveCard = async (cardId, topicPayload) => {
    const topics = cards.map((c) => (c.id === cardId ? topicPayload : c.data)).filter(Boolean)
    setSavingCardId(cardId)
    try {
      await axios.post("/api/chatbot/suggestions", {
        greetingMessage,
        autoReply,
        topics,
      })
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, data: topicPayload } : c)))
      setEditingCount(0)
      toast.success("Saved successfully", {
        style: {
          background: "#bbf7d0",
          color: "#15803d",
          border: "1px solid #86efac",
          fontSize: "16px",
          fontWeight: "600"
        }
      })
    } catch (err) {
      const msg = err.response?.data?.error ?? "Failed to save"
      toast.error(msg, {
        style: {
          background: "#fee2e2",
          color: "#b91c1c",
          border: "1px solid #fca5a5",
          fontSize: "16px",
          fontWeight: "600"
        }
      })
    } finally {
      setSavingCardId(null)
    }
  }

  const filteredCards = searchQuery.trim()
    ? cards.filter((c) => c.data?.topic?.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : cards

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const [activeId, setActiveId] = useState(null)
  const activeCard = cards.find((c) => c.id === activeId)

  const addCard = () => {
    setCards((prev) => [...prev, { id: Date.now() }])
    setEditingCount((c) => c + 1)
  }

  const removeCard = (id, { wasEditing } = {}) => {
    setCards((prev) => prev.filter((card) => card.id !== id))
    if (wasEditing) setEditingCount((c) => c - 1)
  }

  const handleDragStart = ({ active }) => setActiveId(active.id)

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    setCards((prev) => {
      const oldIndex = prev.findIndex((c) => c.id === active.id)
      const newIndex = prev.findIndex((c) => c.id === over.id)
      const reordered = arrayMove(prev, oldIndex, newIndex)
      const positions = reordered.map((c, i) => ({ id: c.id, position: i }))
      axios.post("/api/chatbot/reorder", { positions }).catch(() => {
        toast.error("Failed to save order", {
          style: { background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", fontSize: "16px", fontWeight: "600" }
        })
      })
      return reordered
    })
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="flex">
        <SideBarAdmin />
        <div className="flex flex-col flex-1">
          <span className="headline-5 h-[80px] flex items-center pl-[60px] border-b border-gray-300">Chatbot Setup</span>
          <div className="bg-gray-100 flex-1 p-[60px]">
            <div className="flex flex-col bg-white gap-[40px] px-[80px] pt-[40px] pb-[60px] border border-gray-300">
              {isLoading ? (
                <div className="py-12 text-center text-gray-500">Loading...</div>
              ) : loadError ? (
                <div className="py-12 text-center text-red-600">{loadError}</div>
              ) : (
                <>
              <span className="headline-5 text-gray-600">Default Chatbot Messsages</span>
              <div className="flex flex-col gap-2">
                <span>Greeting message *</span>
                <ValidatedTextarea
                  value={greetingMessage}
                  onChange={(e) => { setGreetingMessage(e.target.value); if (e.target.value.trim()) setGreetingError(false) }}
                  error={greetingError || !greetingMessage.trim()}
                  className="h-[96px]"
                />
                {hasGreetingChanges && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleSaveGreeting}
                      disabled={!greetingMessage.trim() || savingGreeting}
                      className="px-5 py-2.5 text-[16px] font-medium text-white bg-orange-500 rounded-[4px] hover:bg-orange-400 active:bg-orange-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-orange-500"
                    >
                      {savingGreeting ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelGreeting}
                      disabled={savingGreeting}
                      className="body-1 font-semibold text-gray-600 px-4 py-2 rounded-[4px] hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <span>Auto-reply message *</span>
                <ValidatedTextarea
                  value={autoReply}
                  onChange={(e) => { setAutoReply(e.target.value); if (e.target.value.trim()) setAutoReplyError(false) }}
                  error={autoReplyError || !autoReply.trim()}
                  className="h-[96px]"
                />
                {hasAutoReplyChanges && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleSaveAutoReply}
                      disabled={!autoReply.trim() || savingAutoReply}
                      className="px-5 py-2.5 text-[16px] font-medium text-white bg-orange-500 rounded-[4px] hover:bg-orange-400 active:bg-orange-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-orange-500"
                    >
                      {savingAutoReply ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelAutoReply}
                      disabled={savingAutoReply}
                      className="body-1 font-semibold text-gray-600 px-4 py-2 rounded-[4px] hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              {/* section Suggestion menu & Response */}
              <div className="flex items-end justify-between border-t border-gray-300">
                <span className="h-[54px] headline-5 text-gray-600 flex items-end">Suggestion menu & Response</span>
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search topic..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 text-[14px] border border-gray-300 rounded-[4px] outline-none focus:border-orange-400 w-[220px] bg-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-5">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                  <SortableContext items={filteredCards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                    {filteredCards.length === 0 && searchQuery.trim() ? (
                      <p className="text-center text-gray-400 py-6">No suggestion menu found for &quot;{searchQuery}&quot;</p>
                    ) : filteredCards.map((card) => (
                      <CardResponseMenu
                        key={card.id}
                        id={card.id}
                        initialData={card.data}
                        onSave={(topicPayload) => handleSaveCard(card.id, topicPayload)}
                        onCancel={(opts) => removeCard(card.id, opts)}
                        onEditingChange={(isEditing) => {
                          if (!isEditing) setEditingCount((c) => c - 1)
                        }}
                        isSaving={savingCardId === card.id}
                      />
                    ))
                    }
                  </SortableContext>
                  <DragOverlay>
                    {activeCard ? (
                      <CardResponseMenu
                        id={activeCard.id}
                        initialData={activeCard.data}
                        isOverlay
                      />
                    ) : null}
                  </DragOverlay>
                </DndContext>
                {editingCount === 0 && (
                  <div className="flex gap-6">
                    <button
                      onClick={addCard}
                      className="text-[16px] font-medium text-orange-500 w-[246px] h-[48px] border border-orange-500 rounded-[4px] hover:border-orange-400 hover:text-orange-400 active:border-orange-600 active:text-orange-600 cursor-pointer"
                    >
                      + Add Suggestion menu
                    </button>
                  </div>
                )}
              </div>
                  </>
                )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
