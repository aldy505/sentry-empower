FROM ruby:3.4-slim-bookworm

WORKDIR /src

COPY Gemfile Gemfile.lock .
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*
RUN bundle install

COPY . .

CMD ["ruby", "main.rb", "-o", "0.0.0.0"]
