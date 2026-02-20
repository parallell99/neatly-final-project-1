import { useState } from "react"
import SideBarAdmin from "@/components/layout/SideBarAdmin";
import Chatbot from "@/components/layout/chatbot/ChatbotButton"
import CardResponseMenu from "@/components/layout/chatbot/CardResponseMenu"
import BewareIcon from "@/assets/icons/beware.svg"
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"
import { Toaster } from "@/components/ui/sonner"
import { defaultMessage, chatbotTopics } from "@/utils/dataChatbotTest"

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
      {error && <BewareIcon className="absolute top-3 right-3" />}
    </div>
    {error && <ErrorMessage />}
  </div>
)


export default function ChatbotAdmin() {
  const [greetingMessage, setGreetingMessage] = useState(defaultMessage[0].message)
  const [greetingError, setGreetingError] = useState(false)
  const [autoReply, setAutoReply] = useState(defaultMessage[1].message)
  const [autoReplyError, setAutoReplyError] = useState(false)

  const [cards, setCards] = useState(chatbotTopics.map((data, i) => ({ id: i, data })))
  const [editingCount, setEditingCount] = useState(0)

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
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="flex">
        <SideBarAdmin />
        <Chatbot />
        <div className="flex flex-col flex-1">
          <span className="headline-5 h-[80px] flex items-center pl-[60px]">Chatbot Setup</span>
          <div className="bg-gray-100 flex-1 p-[60px]">
            <div className="flex flex-col bg-white gap-[40px] px-[80px] pt-[40px] pb-[60px] border border-gray-300">
              <span className="headline-5 text-gray-600">Default Chatbot Messsages</span>
              <div className="flex flex-col gap-2">
                <span>Greeting message *</span>
                <ValidatedTextarea
                  value={greetingMessage}
                  onChange={(e) => { setGreetingMessage(e.target.value); if (e.target.value.trim()) setGreetingError(false) }}
                  error={greetingError}
                  className="h-[96px]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <span>Auto-reply message *</span>
                <ValidatedTextarea
                  value={autoReply}
                  onChange={(e) => { setAutoReply(e.target.value); if (e.target.value.trim()) setAutoReplyError(false) }}
                  error={autoReplyError}
                  className="h-[96px]"
                />
              </div>
              {/* section Suggestion menu & Response */}
              <span className="h-[54px] headline-5 text-gray-600 flex items-end border-t border-gray-300">Suggestion menu & Response</span>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  {cards.map((card) => (
                    <CardResponseMenu
                      key={card.id}
                      id={card.id}
                      initialData={card.data}
                      onSave={() => {}}
                      onCancel={(opts) => removeCard(card.id, opts)}
                      onEditingChange={(isEditing) => {
                        if (!isEditing) setEditingCount((c) => c - 1)
                      }}
                    />
                  ))}
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
          </div>
        </div>
      </div>
    </>
  );
}
