-- Adds exactly two sample books to library_management.
-- INSERT IGNORE makes it safe to run again; ISBN is unique in the supplied schema.
INSERT IGNORE INTO books (title, author, category, isbn, description, cover_url)
VALUES
  ('The Alchemist', 'Paulo Coelho', 'Fiction', '9780062315007',
   'A fable about following a dream and listening to the signs along the way.',
   'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=500&q=80'),
  ('Atomic Habits', 'James Clear', 'Self growth', '9780735211292',
   'A practical guide to building good habits through small, consistent changes.',
   'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=500&q=80');
