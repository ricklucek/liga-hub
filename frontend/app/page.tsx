
"use client";

import "./globals.css";
import SearchPanel from "../components/SearchPanel";
import SocialPosts from "../components/SocialPosts";
import UserMenu from "../components/UserMenu";
import { useState } from "react";
import MainContent from "../components/MainContent";

export default function Home() {
  const [profile, setProfile] = useState(null);
  return (
    <div className="container">
      <div>
        <SearchPanel onOpenProfile={setProfile} />
      </div>
      <div>
        <MainContent profile={profile} />
      </div>
      <div className="right">
        <SocialPosts />
        <UserMenu />
      </div>
    </div>
  );
}
