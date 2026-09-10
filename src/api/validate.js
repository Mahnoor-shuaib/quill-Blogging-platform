// Content safety ke liye basic validation rules

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 200000; // ~200k characters, kaafi bara post ke liye bhi
const MIN_TITLE_LENGTH = 1;

export function validatePostInput({ title, content }) {
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length < MIN_TITLE_LENGTH) {
      throw new Error('Title cannot be empty.');
    }
    if (title.length > MAX_TITLE_LENGTH) {
      throw new Error(`Title is too long (max ${MAX_TITLE_LENGTH} characters).`);
    }
  }

  if (content !== undefined) {
    if (typeof content !== 'string') {
      throw new Error('Content must be text.');
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      throw new Error(`Content is too long (max ${MAX_CONTENT_LENGTH} characters).`);
    }
  }
}

// Publish/schedule se pehle check karta hai ke post mein actually content hai
export function validateForPublish(post) {
  if (!post.title || post.title.trim().length === 0) {
    throw new Error('Cannot publish a post with an empty title.');
  }
  if (!post.content_md || post.content_md.trim().length === 0) {
    throw new Error('Cannot publish a post with empty content.');
  }
}