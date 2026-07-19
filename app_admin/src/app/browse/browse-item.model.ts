// What the browse components understand. A feature maps its own object onto a
// BrowseItem, so the list and card don't need to know what it really is.
// Trips first; servers and mods later.
export interface BrowseItem {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  description?: string;
  tags?: string[];
  raw?: unknown; // original object, so the consumer can get it back
}

// text/labels the consuming feature passes in
export interface BrowseConfig {
  heading?: string;
  searchPlaceholder?: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  emptyMessage?: string;
}

export interface BrowseAction {
  kind: 'primary' | 'secondary';
  item: BrowseItem;
}
