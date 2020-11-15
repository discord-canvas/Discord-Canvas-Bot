CREATE TABLE weeks (
  time_start BIGINT,
  time_end BIGINT,
  PRIMARY KEY(time_start)
);

CREATE TABLE assignments (
  id INT,
  week_id INT,
  time_due BIGINT,
  course STRING,
  name STRING,
  url STRING,
  points INT,
  FOREIGN KEY(week_id) REFERENCES weeks(time_start),
  FOREIGN KEY(course_id) REFERENCES courses(id),
  PRIMARY KEY(id)
);

CREATE TABLE courses {
  id INT,
  name STRING,
  PRIMARY KEY(id)
};

CREATE TABLE messages {
  message_id STRING,
  channel_id STRING KEY,
  week_id INT,
  FOREIGN KEY(week_id) REFERENCES weeks(time_start),
  PRIMARY KEY(message_id)
};
