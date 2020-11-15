CREATE TABLE weeks (
  time_start BIGINT NOT NULL,
  time_end BIGINT NOT NULL,
  PRIMARY KEY(time_start)
);

CREATE TABLE assignments (
  id INT NOT NULL,
  week_id INT NOT NULL,
  time_due BIGINT NOT NULL,
  course_id TEXT NOT NULL,
  name TEXT,
  url TEXT,
  points INT NOT NULL,
  FOREIGN KEY(week_id) REFERENCES weeks(time_start),
  FOREIGN KEY(course_id) REFERENCES courses(id),
  PRIMARY KEY(id)
);

CREATE TABLE courses (
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  PRIMARY KEY(id)
);

CREATE TABLE messages (
  message_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  week_id INT NOT NULL,
  FOREIGN KEY(week_id) REFERENCES weeks(time_start),
  PRIMARY KEY(message_id)
);
