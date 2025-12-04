"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, Calendar, Star, Building2, Briefcase } from "lucide-react"
import type { MatchedUser } from "@/types"
import { getInitials } from "@/lib/utils"
import Link from "next/link"

interface MatchCardProps {
  match: MatchedUser
  onConnect: () => void
  onMessage: () => void
  onScheduleMeeting: () => void
}

export function MatchCard({
  match,
  onConnect,
  onMessage,
  onScheduleMeeting,
}: MatchCardProps) {
  const { profile, matchScore, matchedInterests, connectionStatus } = match

  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardContent className="p-0">
        {/* Match Score Banner */}
        <div className="flex items-center justify-between bg-gradient-to-r from-primary/10 to-purple-500/10 px-4 py-2">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">{matchScore}% Match</span>
          </div>
          {connectionStatus === "connected" && (
            <Badge variant="success" className="text-xs">Connected</Badge>
          )}
          {connectionStatus === "pending" && (
            <Badge variant="secondary" className="text-xs">Pending</Badge>
          )}
        </div>

        <div className="p-4">
          {/* Profile Info */}
          <div className="flex gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatar_url || ""} />
              <AvatarFallback className="text-lg">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Link 
                href={`/dashboard/networking/profile/${profile.id}`}
                className="text-lg font-semibold hover:text-primary"
              >
                {profile.full_name}
              </Link>
              {profile.job_title && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Briefcase className="h-3 w-3" />
                  {profile.job_title}
                </div>
              )}
              {profile.company && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  {profile.company}
                </div>
              )}
            </div>
          </div>

          {/* Matched Interests */}
          {matchedInterests.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                COMMON INTERESTS
              </p>
              <div className="flex flex-wrap gap-1">
                {matchedInterests.slice(0, 4).map((interest) => (
                  <Badge key={interest} variant="secondary" className="text-xs">
                    {interest}
                  </Badge>
                ))}
                {matchedInterests.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{matchedInterests.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Bio Preview */}
          {profile.bio && (
            <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
              {profile.bio}
            </p>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            {connectionStatus === "none" && (
              <Button onClick={onConnect} className="flex-1">
                Connect
              </Button>
            )}
            {connectionStatus === "connected" && (
              <>
                <Button 
                  variant="outline" 
                  onClick={onMessage}
                  className="flex-1"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Message
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onScheduleMeeting}
                  className="flex-1"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Meet
                </Button>
              </>
            )}
            {connectionStatus === "pending" && (
              <Button variant="outline" disabled className="flex-1">
                Request Sent
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
