
"use client";

import SearchPanel from "../components/SearchPanel";
import SocialPosts from "../components/SocialPosts";
import UserMenu from "../components/UserMenu";
import MainContent from "../components/MainContent";
import { useState } from "react";

export default function Home(){
  const [profile, setProfile] = useState(null);
  return (
    <div className="grid grid-cols-[280px_1fr_280px] gap-4">
      <div className="grid gap-4">
        <SearchPanel onOpenProfile={setProfile} />
      </div>
      <div>
        <MainContent profile={profile} />
      </div>
      <div className="grid gap-4">
        <SocialPosts />
        <UserMenu />
      </div>
    </div>
  );
}
