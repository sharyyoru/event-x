"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Building2,
  Search,
  MapPin,
  Users,
  Star,
  Wifi,
  Car,
  Utensils,
  Monitor,
  Accessibility,
  X,
  Filter,
  Globe,
  Phone,
  Mail,
  ExternalLink,
  Loader2,
  Heart,
  Share2,
  ChevronDown,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Venue {
  id: string
  name: string
  description: string | null
  address: string
  city: string
  state: string | null
  country: string
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  capacity: number | null
  venue_type: string
  amenities: string[]
  images: string[]
  contact_email: string | null
  contact_phone: string | null
  website: string | null
  price_range: string | null
  rating: number | null
  is_featured: boolean
}

const VENUE_TYPES = [
  { value: "all", label: "All Types" },
  { value: "conference_center", label: "Conference Center" },
  { value: "hotel_venue", label: "Hotel Venue" },
  { value: "exhibition_center", label: "Exhibition Center" },
  { value: "creative_space", label: "Creative Space" },
  { value: "outdoor_venue", label: "Outdoor Venue" },
  { value: "theater", label: "Theater" },
]

const COUNTRIES = [
  { value: "all", label: "All Countries" },
  { value: "UAE", label: "United Arab Emirates" },
  { value: "Saudi Arabia", label: "Saudi Arabia" },
  { value: "Qatar", label: "Qatar" },
  { value: "Bahrain", label: "Bahrain" },
  { value: "Kuwait", label: "Kuwait" },
  { value: "Oman", label: "Oman" },
]

const CAPACITY_RANGES = [
  { value: "all", label: "Any Capacity" },
  { value: "small", label: "Up to 100" },
  { value: "medium", label: "100 - 500" },
  { value: "large", label: "500 - 2000" },
  { value: "xlarge", label: "2000+" },
]

const AMENITY_ICONS: Record<string, any> = {
  wifi: Wifi,
  parking: Car,
  catering: Utensils,
  av_equipment: Monitor,
  accessibility: Accessibility,
}

const AMENITY_LABELS: Record<string, string> = {
  wifi: "WiFi",
  parking: "Parking",
  catering: "Catering",
  av_equipment: "AV Equipment",
  accessibility: "Accessible",
  accommodation: "Accommodation",
  outdoor_space: "Outdoor Space",
  beach_access: "Beach Access",
  spa: "Spa",
  metro_access: "Metro Access",
}

export default function VenuesPage() {
  const { toast } = useToast()
  const [venues, setVenues] = useState<Venue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [countryFilter, setCountryFilter] = useState("all")
  const [capacityFilter, setCapacityFilter] = useState("all")
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    fetchVenues()
  }, [])

  const fetchVenues = async () => {
    try {
      const { data, error } = await supabase
        .from("venues")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("rating", { ascending: false })

      if (error) throw error
      setVenues(data || [])
    } catch (error: any) {
      console.error("Error fetching venues:", error)
      toast({
        title: "Error loading venues",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterByCapacity = (venue: Venue) => {
    if (capacityFilter === "all" || !venue.capacity) return true
    const cap = venue.capacity
    switch (capacityFilter) {
      case "small": return cap <= 100
      case "medium": return cap > 100 && cap <= 500
      case "large": return cap > 500 && cap <= 2000
      case "xlarge": return cap > 2000
      default: return true
    }
  }

  const filteredVenues = venues.filter((venue) => {
    const matchesSearch =
      venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || venue.venue_type === typeFilter
    const matchesCountry = countryFilter === "all" || venue.country === countryFilter
    const matchesCapacity = filterByCapacity(venue)
    return matchesSearch && matchesType && matchesCountry && matchesCapacity
  })

  const toggleFavorite = (venueId: string) => {
    setFavorites(prev =>
      prev.includes(venueId)
        ? prev.filter(id => id !== venueId)
        : [...prev, venueId]
    )
  }

  const getPriceRangeColor = (range: string | null) => {
    switch (range) {
      case "$": return "text-green-600"
      case "$$": return "text-yellow-600"
      case "$$$": return "text-orange-600"
      case "$$$$": return "text-red-600"
      default: return "text-muted-foreground"
    }
  }

  const formatVenueType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
  }

  const activeFiltersCount = [
    typeFilter !== "all",
    countryFilter !== "all",
    capacityFilter !== "all",
  ].filter(Boolean).length

  const featuredVenues = filteredVenues.filter(v => v.is_featured)
  const regularVenues = filteredVenues.filter(v => !v.is_featured)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Venues</h1>
          <p className="text-muted-foreground">
            Discover the perfect venue for your next event
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {filteredVenues.length} venues
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search venues by name, city, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-foreground"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </Button>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="grid gap-4 md:grid-cols-3 pt-4 border-t">
                <div className="space-y-2">
                  <Label className="text-foreground">Venue Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VENUE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Country</Label>
                  <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger className="text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground">Capacity</Label>
                  <Select value={capacityFilter} onValueChange={setCapacityFilter}>
                    <SelectTrigger className="text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CAPACITY_RANGES.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Active Filters */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {typeFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {formatVenueType(typeFilter)}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setTypeFilter("all")}
                    />
                  </Badge>
                )}
                {countryFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {countryFilter}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setCountryFilter("all")}
                    />
                  </Badge>
                )}
                {capacityFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {CAPACITY_RANGES.find(r => r.value === capacityFilter)?.label}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setCapacityFilter("all")}
                    />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTypeFilter("all")
                    setCountryFilter("all")
                    setCapacityFilter("all")
                  }}
                  className="text-muted-foreground"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Featured Venues */}
      {featuredVenues.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            Featured Venues
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {featuredVenues.map((venue) => (
              <Card
                key={venue.id}
                className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => setSelectedVenue(venue)}
              >
                <div className="h-48 bg-gradient-to-br from-primary/30 to-primary/10 relative flex items-center justify-center">
                  <Building2 className="h-20 w-20 text-primary/40" />
                  <Badge className="absolute top-3 left-3 bg-yellow-500 text-white">
                    <Star className="h-3 w-3 mr-1 fill-white" />
                    Featured
                  </Badge>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(venue.id)
                    }}
                  >
                    <Heart className={`h-4 w-4 ${favorites.includes(venue.id) ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {venue.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {venue.city}, {venue.country}
                      </CardDescription>
                    </div>
                    {venue.rating && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        {venue.rating}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {venue.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      {venue.capacity && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {venue.capacity.toLocaleString()}
                        </span>
                      )}
                      {venue.price_range && (
                        <span className={`font-semibold ${getPriceRangeColor(venue.price_range)}`}>
                          {venue.price_range}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {venue.amenities?.slice(0, 4).map((amenity) => {
                        const Icon = AMENITY_ICONS[amenity] || Building2
                        return (
                          <div
                            key={amenity}
                            className="h-7 w-7 rounded bg-muted flex items-center justify-center"
                            title={AMENITY_LABELS[amenity] || amenity}
                          >
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        )
                      })}
                      {venue.amenities?.length > 4 && (
                        <div className="h-7 w-7 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          +{venue.amenities.length - 4}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Venues */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">All Venues</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : regularVenues.length === 0 && featuredVenues.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No venues found</h3>
              <p className="text-muted-foreground text-center">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {regularVenues.map((venue) => (
              <Card
                key={venue.id}
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => setSelectedVenue(venue)}
              >
                <div className="h-36 bg-gradient-to-br from-muted to-muted/50 relative flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-muted-foreground/40" />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(venue.id)
                    }}
                  >
                    <Heart className={`h-3.5 w-3.5 ${favorites.includes(venue.id) ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-1">
                    {venue.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {venue.city}, {venue.country}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      {venue.capacity && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          {venue.capacity.toLocaleString()}
                        </span>
                      )}
                      {venue.rating && (
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                          {venue.rating}
                        </span>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatVenueType(venue.venue_type)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Venue Detail Modal */}
      <Dialog open={!!selectedVenue} onOpenChange={() => setSelectedVenue(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedVenue && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-2xl">{selectedVenue.name}</DialogTitle>
                    <DialogDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4" />
                      {selectedVenue.address}, {selectedVenue.city}, {selectedVenue.country}
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => toggleFavorite(selectedVenue.id)}
                    >
                      <Heart className={`h-4 w-4 ${favorites.includes(selectedVenue.id) ? "fill-red-500 text-red-500" : ""}`} />
                    </Button>
                    <Button size="icon" variant="outline">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Hero Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
                  <Building2 className="h-16 w-16 text-primary/40" />
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Users className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-lg font-semibold">
                      {selectedVenue.capacity?.toLocaleString() || "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground">Capacity</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Star className="h-5 w-5 mx-auto mb-2 text-yellow-500" />
                    <p className="text-lg font-semibold">
                      {selectedVenue.rating || "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Building2 className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <p className={`text-lg font-semibold ${getPriceRangeColor(selectedVenue.price_range)}`}>
                      {selectedVenue.price_range || "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground">Price Range</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-muted-foreground">
                    {selectedVenue.description || "No description available."}
                  </p>
                </div>

                {/* Amenities */}
                {selectedVenue.amenities?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedVenue.amenities.map((amenity) => (
                        <Badge key={amenity} variant="secondary" className="gap-1">
                          {(() => {
                            const Icon = AMENITY_ICONS[amenity] || Building2
                            return <Icon className="h-3 w-3" />
                          })()}
                          {AMENITY_LABELS[amenity] || amenity.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div>
                  <h3 className="font-semibold mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    {selectedVenue.contact_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedVenue.contact_phone}</span>
                      </div>
                    )}
                    {selectedVenue.contact_email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${selectedVenue.contact_email}`} className="text-primary hover:underline">
                          {selectedVenue.contact_email}
                        </a>
                      </div>
                    )}
                    {selectedVenue.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a href={selectedVenue.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                          Visit Website
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button className="flex-1">
                    <Mail className="mr-2 h-4 w-4" />
                    Request Quote
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Schedule Tour
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
