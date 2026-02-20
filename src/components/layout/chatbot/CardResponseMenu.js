import { useState } from "react"
import Button from "@/components/ui/buttons/buttons"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog"
import BewareIcon from "@/assets/icons/beware.svg"
import BinIcon from "@/assets/icons/bin.svg"
import DragIcon from "@/assets/icons/drag.svg"
import PencilEditIcon from "@/assets/icons/pencil-edit.svg"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"

const ROOM_TYPES = ["Superior Garden View", "Deluxe", "Superior", "Supreme", "Premium Sea View", "Suite"]

const ErrorMessage = () => (
  <span className="body-2 font-normal! text-red">Please fill in this field</span>
)

const ValidatedInput = ({ value, onChange, error, className = "", ...props }) => (
  <div>
    <div className="relative">
      <input
        value={value}
        onChange={onChange}
        className={`bg-white h-[48px] w-full border rounded-[8px] p-3 pr-10 outline-none ${error ? "border-red" : "border-gray-400"} ${className}`}
        {...props}
      />
      {error && <BewareIcon className="absolute top-1/2 -translate-y-1/2 right-4" />}
    </div>
    {error && <ErrorMessage />}
  </div>
)

const FORMAT_MAP = {
  "Room type": "room-type",
  "Message": "message",
  "Option with details": "option-with-details",
}

export default function CardResponseMenu({ id, onSave, onCancel, onEditingChange, initialData, isOverlay = false }) {
  const isSaved = initialData

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: id ?? "" })

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const [replyFormat, setReplyFormat] = useState(isSaved ? (FORMAT_MAP[initialData.replyFormat] ?? "") : "")
  const [selectedRoomTypes, setSelectedRoomTypes] = useState(initialData?.roomTypes ?? [])
  const [roomTypeSelectKey, setRoomTypeSelectKey] = useState(0)

  const [topic, setTopic] = useState(initialData?.topic ?? "")
  const [topicError, setTopicError] = useState(false)
  const [replyFormatError, setReplyFormatError] = useState(false)

  const [roomReplyTitle, setRoomReplyTitle] = useState(initialData?.replyTitle ?? "")
  const [roomReplyTitleError, setRoomReplyTitleError] = useState(false)
  const [roomTypeError, setRoomTypeError] = useState(false)
  const [buttonName, setButtonName] = useState(initialData?.buttonName ?? "")
  const [buttonNameError, setButtonNameError] = useState(false)

  const [optionReplyTitle, setOptionReplyTitle] = useState(initialData?.replyTitle ?? "")
  const [optionReplyTitleError, setOptionReplyTitleError] = useState(false)
  const [options, setOptions] = useState(
    initialData?.options ?? [{ option: "", details: "" }]
  )
  const [optionErrors, setOptionErrors] = useState(
    (initialData?.options ?? [{ option: "", details: "" }]).map(() => ({ optionError: false, detailsError: false }))
  )

  const [replyMessage, setReplyMessage] = useState(initialData?.replyMessage ?? "")
  const [replyMessageError, setReplyMessageError] = useState(false)

  const [hasError, setHasError] = useState(!isSaved)

  const addOption = () => {
    setOptions((prev) => [...prev, { option: "", details: "" }])
    setOptionErrors((prev) => [...prev, { optionError: false, detailsError: false }])
  }

  const updateOption = (index, field, value) => {
    setOptions((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
    if (value.trim()) {
      setOptionErrors((prev) => prev.map((err, i) =>
        i === index ? { ...err, [`${field}Error`]: false } : err
      ))
    }
  }

  const toggleRoomType = (type) => {
    setSelectedRoomTypes((prev) => {
      const next = prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
      if (next.length > 0) setRoomTypeError(false)
      return next
    })
    setRoomTypeSelectKey((k) => k + 1)
  }

  const handleSave = () => {
    let hasErrorCycle = false

    if (!topic.trim()) { setTopicError(true); setHasError(true); hasErrorCycle = true }
    if (!replyFormat) { setReplyFormatError(true); setHasError(true); hasErrorCycle = true }

    if (replyFormat === "room-type") {
      if (!roomReplyTitle.trim()) { setRoomReplyTitleError(true); setHasError(true); hasErrorCycle = true }
      if (selectedRoomTypes.length === 0) { setRoomTypeError(true); setHasError(true); hasErrorCycle = true }
      if (!buttonName.trim()) { setButtonNameError(true); setHasError(true); hasErrorCycle = true }
    }

    if (replyFormat === "option-with-details") {
      if (!optionReplyTitle.trim()) { setOptionReplyTitleError(true); setHasError(true); hasErrorCycle = true }
      const newOptionErrors = options.map((item) => ({
        optionError: !item.option.trim(),
        detailsError: !item.details.trim(),
      }))
      setOptionErrors(newOptionErrors)
      if (newOptionErrors.some((e) => e.optionError || e.detailsError)) { setHasError(true); hasErrorCycle = true }
    }

    if (replyFormat === "message") {
      if (!replyMessage.trim()) { setReplyMessageError(true); setHasError(true); hasErrorCycle = true }
    }

    if (hasErrorCycle) return
    setHasError(false)
    onEditingChange?.(false)
    onSave?.()
    toast.success("Saved successfully", {
      style: {
        background: "#bbf7d0",
        color: "#15803d",
        border: "1px solid #86efac",
        fontSize: "16px",
        fontWeight: "600"
      }
    })
  }

  const handleCancel = () => {
    if (isSaved) {
      // revert กลับ initialData เดิม
      setTopic(initialData?.topic ?? "")
      setReplyFormat(isSaved ? (FORMAT_MAP[initialData.replyFormat] ?? "") : "")
      setRoomReplyTitle(initialData?.replyTitle ?? "")
      setSelectedRoomTypes(initialData?.roomTypes ?? [])
      setRoomTypeSelectKey((k) => k + 1)
      setButtonName(initialData?.buttonName ?? "")
      setOptionReplyTitle(initialData?.replyTitle ?? "")
      setOptions(initialData?.options ?? [{ option: "", details: "" }])
      setOptionErrors((initialData?.options ?? [{}]).map(() => ({ optionError: false, detailsError: false })))
      setReplyMessage(initialData?.replyMessage ?? "")
    } else {
      // card ใหม่ที่ยังไม่มีข้อมูล — ลบทิ้ง
      onCancel?.({ wasEditing: true })
      return
    }
    // clear errors และกลับ read-only
    setTopicError(false)
    setReplyFormatError(false)
    setRoomReplyTitleError(false)
    setRoomTypeError(false)
    setButtonNameError(false)
    setOptionReplyTitleError(false)
    setReplyMessageError(false)
    setHasError(false)
  }

  const handleDelete = () => setShowDeleteDialog(true)

  const confirmDelete = () => {
    setShowDeleteDialog(false)
    toast("Deleted successfully", {
      icon: <BinIcon className="w-6 h-6 text-orange-700" style={{ color: "#c2410c" }} />,
      style: {
        background: "#F9DACE",
        color: "#803010",
        border: "1px solid #fdba74",
        fontSize: "16px",
        fontWeight: "600"
      }
    })
    onCancel?.({ wasEditing: hasError })
  }

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={{ transform: CSS.Transform.toString(transform), transition }}
        {...attributes}
        className="bg-gray-200 rounded-[8px] border-2 border-dashed border-gray-400 h-[80px]"
      />
    )
  }

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={isOverlay ? undefined : { transform: CSS.Transform.toString(transform), transition }}
      {...(isOverlay ? {} : attributes)}
      className={`bg-gray-100 p-6 flex gap-4 rounded-[8px] text-gray-900 hover:bg-gray-200 ${isOverlay ? "shadow-2xl cursor-grabbing opacity-80" : ""} ${hasError? "border":""}`}
    >
      {/* fields */}
      <div className="flex flex-col gap-6 flex-1">
        <div className="flex gap-10">
          <div className="flex flex-col body-1 gap-1 w-[50%]">
            <span>Topic *</span>
            <ValidatedInput
              value={topic}
              onChange={(e) => { setTopic(e.target.value); if (e.target.value.trim()) setTopicError(false) }}
              error={topicError}
              readOnly={!hasError}
            />
          </div>
          <div className="flex flex-col body-1 gap-1 w-[50%]">
            <span>Reply format</span>
            <div>
              <div className="relative">
                <Select value={replyFormat} onValueChange={(val) => { setReplyFormat(val); setReplyFormatError(false) }} disabled={!hasError}>
                  <SelectTrigger className={`w-full h-[48px]! border rounded-[8px] bg-white text-[16px] ${replyFormatError ? "border-red" : "border-gray-400"}`}>
                    <SelectValue placeholder="Select reply format" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="room-type" className="text-[16px]">Room type</SelectItem>
                    <SelectItem value="message" className="text-[16px]">Message</SelectItem>
                    <SelectItem value="option-with-details" className="text-[16px]">Option with details</SelectItem>
                  </SelectContent>
                </Select>
                {replyFormatError && <BewareIcon className="absolute top-1/2 -translate-y-1/2 right-9 pointer-events-none" />}
              </div>
              {replyFormatError && <ErrorMessage />}
            </div>
          </div>
        </div>

        {/* Room type fields */}
        {replyFormat === "room-type" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="body-1">Reply title</span>
              <ValidatedInput
                value={roomReplyTitle}
                onChange={(e) => { setRoomReplyTitle(e.target.value); if (e.target.value.trim()) setRoomReplyTitleError(false) }}
                error={roomReplyTitleError}
                readOnly={!hasError}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="body-1">Room type</span>
              <div className={`relative bg-white border rounded-[8px] p-3 flex flex-wrap gap-2 min-h-[48px] ${roomTypeError ? "border-red" : "border-gray-400"}`}>
                {selectedRoomTypes.map((type) => (
                  <span key={type} className="flex items-center gap-1 bg-gray-200 text-gray-800 body-1 px-3 py-1 rounded-full">
                    {type}
                    {hasError && <button onClick={() => toggleRoomType(type)} className="pl-1 text-gray-800 font-semibold hover:text-gray-700 cursor-pointer">✕</button>}
                  </span>
                ))}
                {hasError && selectedRoomTypes.length < ROOM_TYPES.length && (
                  <Select key={roomTypeSelectKey} onValueChange={toggleRoomType}>
                    <SelectTrigger className="h-[32px]! w-fit! border-none shadow-none bg-transparent text-gray-400 body-1 p-0 gap-1">
                      <SelectValue placeholder="+ Add" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {ROOM_TYPES.filter((t) => !selectedRoomTypes.includes(t)).map((type) => (
                        <SelectItem key={type} value={type} className="body-1">{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {roomTypeError && <BewareIcon className="absolute top-1/2 -translate-y-1/2 right-4" />}
              </div>
              {roomTypeError && <ErrorMessage />}
            </div>
            <div className="flex flex-col gap-1">
              <span className="body-1">Button name</span>
              <ValidatedInput
                value={buttonName}
                onChange={(e) => { setButtonName(e.target.value); if (e.target.value.trim()) setButtonNameError(false) }}
                error={buttonNameError}
                readOnly={!hasError}
              />
            </div>
          </div>
        )}

        {/* Option with details fields */}
        {replyFormat === "option-with-details" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="body-1">Reply title</span>
              <ValidatedInput
                value={optionReplyTitle}
                onChange={(e) => { setOptionReplyTitle(e.target.value); if (e.target.value.trim()) setOptionReplyTitleError(false) }}
                error={optionReplyTitleError}
                readOnly={!hasError}
              />
            </div>
            {options.map((item, index) => (
              <div key={index} className="flex gap-10">
                <div className="flex flex-col gap-1 w-[50%]">
                  <span className="body-1">Option</span>
                  <ValidatedInput
                    value={item.option}
                    onChange={(e) => updateOption(index, "option", e.target.value)}
                    error={optionErrors[index]?.optionError}
                    readOnly={!hasError}
                  />
                </div>
                <div className="flex flex-col gap-1 w-[50%]">
                  <span className="body-1">Details</span>
                  <ValidatedInput
                    value={item.details}
                    onChange={(e) => updateOption(index, "details", e.target.value)}
                    error={optionErrors[index]?.detailsError}
                    readOnly={!hasError}
                  />
                </div>
              </div>
            ))}
            {hasError && (
              <button
                onClick={addOption}
                className="text-[16px] font-medium text-orange-500 w-[160px] h-[48px] border border-orange-500 rounded-[4px] hover:border-orange-400 hover:text-orange-400 active:border-orange-600 active:text-orange-600 cursor-pointer"
              >
                + Add Option
              </button>
            )}
          </div>
        )}

        {/* Message fields */}
        {replyFormat === "message" && (
          <div className="flex flex-col gap-1">
            <span className="body-1">Reply message</span>
            <ValidatedInput
              value={replyMessage}
              onChange={(e) => { setReplyMessage(e.target.value); if (e.target.value.trim()) setReplyMessageError(false) }}
              error={replyMessageError}
              readOnly={!hasError}
            />
          </div>
        )}

        {/* save and cancel */}
        {hasError && (
          <div className="flex gap-6">
            <Button buttonText="Save" buttonStyle="primary" className="w-[100px]" onClick={handleSave} />
            <button className="body-1 font-semibold text-gray-600 px-4 py-2 rounded-[4px] hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-colors cursor-pointer" onClick={handleCancel}>Cancel</button>
          </div>
        )}
      </div>

      {/* icon column */}
      <div className="flex flex-col items-center gap-3 pt-1">
        <DragIcon {...listeners} className="cursor-grab active:cursor-grabbing" />
        <PencilEditIcon className="cursor-pointer" onClick={() => setHasError(true)} />
        <BinIcon className="cursor-pointer" onClick={handleDelete} />
      </div>

      {/* delete confirm dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent >
          <AlertDialogHeader className="flex flex-col gap-3">
            <AlertDialogTitle className="headline-5 border-b border-b-gray-300 w-full pb-3">Delete Suggestion menu?</AlertDialogTitle>
            <AlertDialogDescription className="body-1 mt-2">
              Are you sure you want to delete this suggestion menu?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-5">
            <button
              className="px-5 py-2 rounded border border-orange-600 text-orange-600 body-2 hover:bg-orange-50 transition-colors cursor-pointer"
              onClick={confirmDelete}
            >
              Yes, I want to delete
            </button>
            <button
              className="px-5 py-2 rounded bg-orange-600 text-white body-2 hover:bg-orange-700 transition-colors cursor-pointer"
              onClick={() => setShowDeleteDialog(false)}
            >
              No, I don&apos;t
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
