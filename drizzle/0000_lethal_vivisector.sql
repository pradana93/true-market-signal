CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(100) NOT NULL,
	"instrument_id" integer NOT NULL,
	"condition" jsonb NOT NULL,
	"channel" varchar(50) NOT NULL,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "candles" (
	"id" serial PRIMARY KEY NOT NULL,
	"instrument_id" integer NOT NULL,
	"tf" varchar(10) NOT NULL,
	"ts" timestamp NOT NULL,
	"open" real NOT NULL,
	"high" real NOT NULL,
	"low" real NOT NULL,
	"close" real NOT NULL,
	"volume" real NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "instruments" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(50) NOT NULL,
	"market" varchar(20) NOT NULL,
	"exchange" varchar(50),
	"provider_ids" jsonb,
	"enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "instruments_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "orderbook_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"instrument_id" integer NOT NULL,
	"ts" timestamp NOT NULL,
	"bids" jsonb NOT NULL,
	"asks" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "signal_weights" (
	"id" serial PRIMARY KEY NOT NULL,
	"market" varchar(20) NOT NULL,
	"tf" varchar(10) NOT NULL,
	"regime" varchar(20) NOT NULL,
	"method_id" varchar(100) NOT NULL,
	"weight" real NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"instrument_id" integer NOT NULL,
	"tf" varchar(10) NOT NULL,
	"direction" varchar(10) NOT NULL,
	"confidence" real NOT NULL,
	"reason" text NOT NULL,
	"evidence" jsonb NOT NULL,
	"invalidation" real,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "trades_agg" (
	"id" serial PRIMARY KEY NOT NULL,
	"instrument_id" integer NOT NULL,
	"ts" timestamp NOT NULL,
	"bucket" varchar(20) NOT NULL,
	"buy_vol" real NOT NULL,
	"sell_vol" real NOT NULL,
	"delta" real NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "watchlists" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"symbols" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
