import { formatDateGroup } from "./formatTime";

export function groupMessagesByDate(messages) {
  return messages.reduce((groups, message) => {
    const key = formatDateGroup(message.createdAt);

    if (!groups[key]) groups[key] = [];
    groups[key].push(message);

    return groups;
  }, {});
}
