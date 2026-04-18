import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("userEmail");
    const task = searchParams.get("task");

    if (!userEmail || !task) {
      return NextResponse.json(
        { error: "userEmail and task are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("WebCrawlerPortal");
    const collection = db.collection("jobs");

    const jobs = await collection
      .find({ user_email: userEmail, task: task })
      .sort({ _id: -1 })
      .toArray();

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}