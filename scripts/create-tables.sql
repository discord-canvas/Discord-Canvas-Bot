CREATE TABLE weekly_updates (
  id INT PRIMARY KEY,
  message_id STRING,
  time_start BIGINT,
  time_end BIGINT
);

CREATE TABLE assignments (
  id INT PRIMARY KEY,
  week_id INT,
  time_due BIGINT,
  course_id INT,
  name STRING,
  points INT
);

CREATE TABLE courses {
  id INT PRIMARY KEY,
  name STRING
};
