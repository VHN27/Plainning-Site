DROP TABLE IF EXISTS attendees;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS attendees_pending;
DROP TABLE IF EXISTS events_pending CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  password TEXT,
  email VARCHAR(255) UNIQUE
);

INSERT INTO users (username, password, email) 
VALUES 
('admin', 'admin123', 'admin@exemple.com'), 
('user1', 'password1', 'user1@exemple.com'), 
('user2', 'password2', 'user2@exemple.com');

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(255) UNIQUE NOT NULL,
  dtstamp VARCHAR(255) NOT NULL,
  dtstart VARCHAR(255) NOT NULL,
  dtend VARCHAR(255) NOT NULL,
  summary VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  status VARCHAR(50),
  organizer INT,
  FOREIGN KEY (organizer) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO events (uid, dtstamp, dtstart, dtend, summary, description, location, status, organizer) VALUES 
('event1', '2023-10-01T12:00:00Z', '2023-10-01T14:00:00Z', '2023-10-01T15:00:00Z', 'Meeting', 'Project meeting', 'Office', 'CONFIRMED', 1),
('event2', '2023-10-02T12:00:00Z', '2023-10-02T14:00:00Z', '2023-10-02T15:00:00Z', 'Conference', 'Annual conference', 'Convention Center', 'TENTATIVE', 2),
('event3', '2023-10-03T12:00:00Z', '2023-10-03T14:00:00Z', '2023-10-03T15:00:00Z', 'Workshop', 'Skill development workshop', 'Community Hall', 'CANCELLED', 1),
('event4', '2025-05-10T12:00:00Z', '2025-05-10T12:00:00Z', '2025-05-10T12:00:00Z', 'Example', 'Skill development workshop', 'Community Hall', 'CANCELLED', 1);

CREATE TABLE attendees (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_event_user UNIQUE (event_id, user_id)
);

INSERT INTO attendees (event_id, user_id) VALUES 
(1, 2),
(2, 1),
(3, 2),
(3, 3),
(4, 3);

CREATE TABLE events_pending (
  id SERIAL PRIMARY KEY,
  uid VARCHAR(255) NOT NULL,
  dtstamp VARCHAR(255) NOT NULL,
  dtstart VARCHAR(255) NOT NULL,
  dtend VARCHAR(255) NOT NULL,
  summary VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  status VARCHAR(50),
  organizer INT,
  FOREIGN KEY (organizer) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO events_pending (uid, dtstamp, dtstart, dtend, summary, description, location, status, organizer) VALUES 
('event_pending1', '2023-10-01T12:00:00Z', '2023-10-01T14:00:00Z', '2023-10-01T15:00:00Z', 'Event_pending1', 'Project meeting', 'Office', 'CONFIRMED', 1),
('event_pending2', '2023-10-02T12:00:00Z', '2023-10-02T14:00:00Z|2023-10-02T18:00:00Z', '2023-10-02T15:00:00Z|2023-10-02T19:00:00Z', 'Event_pending2', 'Annual conference', 'Convention Center', 'TENTATIVE', 1);

CREATE TABLE attendees_pending (
  id SERIAL PRIMARY KEY,
  event_id INT NOT NULL,
  user_id INT NOT NULL,
  dtstart VARCHAR(255),
  dtend VARCHAR(255),
  FOREIGN KEY (event_id) REFERENCES events_pending(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_event_user_pending UNIQUE (event_id, user_id)
);

INSERT INTO attendees_pending (event_id, user_id) VALUES 
(1, 2),
(2, 2),
(2, 3);
