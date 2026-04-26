import Playlist from "../models/Playlist.js";

export const isPlaylistOwner = async (req, res, next) => {
  const playlist = await Playlist.findById(req.params.id);
  if (!playlist) {
    console.error("Ownership: Playlist not found");
    return res.status(404).json({ error: "Playlist not found" });
  }
  if (!playlist.user || !playlist.user.equals(req.user._id)) {
    console.error("Ownership: Not authorized to modify this playlist");
    return res
      .status(403)
      .json({ error: "Not authorized to modify this playlist" });
  }
  req.playlist = playlist;
  next();
};

/**
 * Placeholder for extension work (playlist sharing). Not wired to any route yet.
 * Implement authorization for “shared with me” access when you add those routes;
 * until then, leaving this empty is intentional—see docs/SHARE_SYSTEM.md.
 */
export const isPlaylistSharedWithUser = async (req, res, next) => {
  // TODO: Implement this (student / course extension)
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      console.error("SharedWith: Playlist not found");
      return res.status(404).json({ error: "Playlist not found" });
    }
    // Om användare äger playlist och user.id finns i sharedWith-arrayen.
    const isOwner = playlist.user && playlist.user.equals(req.user._id);
    const isShared =
      playlist.sharedWith && playlist.sharedWith.includes(req.user._id);
    if (isOwner || isShared) {
      // Om användaren är ägare eller playlisten är delad med användaren, så spara ner playlist.
      req.playlist = playlist;
      return next();
    }
    return res
      .status(403)
      .json({ error: "Access denied. This playlist is not shared with you." });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
