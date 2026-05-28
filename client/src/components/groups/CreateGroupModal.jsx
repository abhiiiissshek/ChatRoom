import { Search, Users } from "lucide-react";
import { useState } from "react";
import Avatar from "../ui/Avatar";
import IconButton from "../ui/IconButton";
import Modal from "../ui/Modal";

export default function CreateGroupModal({
  open,
  onClose,
  searchUsers,
  onCreate,
  user,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [members, setMembers] = useState([]);

  const runSearch = async () => {
    if (!query.trim()) return;

    try {
      const found = await searchUsers(query);
      setResults(found || []);
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  const toggleMember = (person) => {
    setMembers((current) =>
      current.some((item) => item.uid === person.uid)
        ? current.filter((item) => item.uid !== person.uid)
        : [...current, person]
    );
  };

  const resetModal = () => {
    setTitle("");
    setDescription("");
    setMembers([]);
    setResults([]);
    setQuery("");
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!title.trim()) return;

    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        members: members.map((item) => item.uid),
        createdBy: user.uid,
      });

      resetModal();
      onClose();
    } catch (err) {
      console.error("Create group failed:", err);
    }
  };

  return (
    <Modal
      open={open}
      title="Create group"
      onClose={() => {
        resetModal();
        onClose();
      }}
      className="max-w-xl"
    >
      <form onSubmit={submit} className="space-y-4 p-4">
        <div className="grid gap-3 sm:grid-cols-[72px_1fr]">
          <div className="grid h-[72px] w-[72px] place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-slate-300">
            <Users size={24} />
          </div>

          <div className="space-y-2">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Group name"
              className="profile-input"
            />

            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Description"
              className="profile-input"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search members"
            className="profile-input h-11"
          />

          <IconButton
            title="Search members"
            type="button"
            onClick={runSearch}
            className="bg-cyan-300 text-zinc-950 hover:bg-cyan-200"
          >
            <Search size={17} />
          </IconButton>
        </div>

        {members.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {members.map((member) => (
              <button
                key={member.uid}
                type="button"
                onClick={() => toggleMember(member)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] py-1 pl-1 pr-3 text-sm text-slate-200"
              >
                <Avatar
                  src={member.photoURL}
                  name={member.name}
                  size="sm"
                />

                {member.name}
              </button>
            ))}
          </div>
        )}

        <div className="max-h-56 space-y-1 overflow-y-auto">
          {results.map((person) => (
            <button
              key={person.uid}
              type="button"
              onClick={() => toggleMember(person)}
              className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-white/[0.08]"
            >
              <Avatar
                src={person.photoURL}
                name={person.name}
              />

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-white">
                  {person.name}
                </h3>

                <p className="truncate text-xs text-slate-500">
                  @{person.username}
                </p>
              </div>

              <span className="text-xs text-cyan-200">
                {members.some((item) => item.uid === person.uid)
                  ? "Added"
                  : "Add"}
              </span>
            </button>
          ))}
        </div>

        <button
          type="submit"
          className="h-11 w-full rounded-2xl bg-cyan-300 font-semibold text-zinc-950 transition hover:bg-cyan-200"
        >
          Create group
        </button>
      </form>
    </Modal>
  );
}