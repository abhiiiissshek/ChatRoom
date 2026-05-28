import {
  Archive,
  BellOff,
  Ban,
  Download,
  Flag,
  Pin,
  Search,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";
import DropdownMenu from "../ui/DropdownMenu";

const menuItems = [
  { id: "profile", label: "View Profile", icon: UserRound },
  { id: "pin", label: "Pin Chat", icon: Pin },
  { id: "mute", label: "Mute Chat", icon: BellOff },
  { id: "archive", label: "Archive Chat", icon: Archive },
  { id: "search", label: "Search Messages", icon: Search },
  { id: "export", label: "Export Chat History", icon: Download },
  { id: "clear", label: "Clear Chat", icon: XCircle },
  { id: "delete", label: "Delete Chat", icon: Trash2, danger: true },
  { id: "block", label: "Block User", icon: Ban, danger: true },
  { id: "report", label: "Report User", icon: Flag, danger: true },
];

export default function ChatMenu({ open, onClose, onAction, anchorRef, state = {} }) {
  const items = menuItems.map((item) => ({
    ...item,
    label:
      item.id === "mute" && state.muted
        ? "Unmute Chat"
        : item.id === "pin" && state.pinned
        ? "Unpin Chat"
        : item.id === "archive" && state.archived
        ? "Unarchive Chat"
        : item.label,
    onSelect: () => onAction(item.id),
  }));

  return (
    <DropdownMenu
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      items={items}
      label="Chat options"
      width={286}
    />
  );
}
