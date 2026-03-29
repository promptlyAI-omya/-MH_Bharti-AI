"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, User as UserIcon } from "lucide-react";
import { useAuth } from "@/components/FirebaseAuthProvider";

interface LeaderboardUser {
  id: string;
  name: string | null;
  phone: string | null;
  points: number;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<{ rank: number; points: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        let url = "/api/users/leaderboard";
        if (user?.id) {
          url += `?userId=${user.id}`;
        }
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.leaderboard) {
          setLeaders(data.leaderboard);
        }
        
        if (data.userRank !== undefined && data.userRank !== null) {
          setUserRank({ rank: data.userRank, points: data.userPoints });
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user]);

  return (
    <div className="max-w-md mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-saffron-gradient flex items-center justify-center shadow-lg shadow-saffron/20">
          <Trophy size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">लीडरबोर्ड</h1>
          <p className="text-xs text-gray-400">टॉप 10 विद्यार्थी</p>
        </div>
      </div>

      {userRank && (
        <div className="glass rounded-xl p-4 mb-6 flex items-center justify-between border-saffron/30">
          <div>
            <p className="text-xs text-gray-400">तुमचा क्रमांक</p>
            <p className="text-2xl font-bold text-saffron">#{userRank.rank}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">तुमचे एकूण गुण</p>
            <p className="text-lg font-bold text-white">{userRank.points} 🏆</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <p className="text-center text-sm text-gray-400 py-10">लोड करत आहे...</p>
        ) : leaders.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10">अजून कोणीही लीडरबोर्डवर नाही.</p>
        ) : (
          leaders.map((leader, index) => {
            const isMe = user?.id === leader.id;
            
            return (
              <div 
                key={leader.id} 
                className={`glass rounded-xl p-4 flex items-center gap-4 transition-transform hover:scale-[1.02] ${isMe ? 'border-saffron/50 bg-saffron/5' : ''}`}
              >
                <div className={`w-8 font-bold flex justify-center text-lg ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                  {index < 3 ? <Medal size={24} /> : `#${index + 1}`}
                </div>
                
                <div className="w-10 h-10 rounded-full bg-dark-bg border border-dark-border flex items-center justify-center shrink-0">
                  <UserIcon size={20} className="text-gray-400" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate text-sm">
                    {leader.name || leader.phone || "अज्ञात विद्यार्थी"} {isMe && <span className="text-xs text-saffron ml-1">(तू)</span>}
                  </p>
                </div>

                <div className="font-bold text-saffron">
                  {leader.points}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
