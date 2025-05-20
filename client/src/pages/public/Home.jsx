import { useSearchPropertiesQuery } from '@/services/propertyApi';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/shadcn/card';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from '@/components/shadcn/select';
import { Badge } from '@/components/shadcn/badge';
import { Skeleton } from '@/components/shadcn/skeleton';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Link } from 'react-router';
import { Switch } from '@/components/shadcn/switch';
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  TbMapPin,
  TbBed,
  TbBath,
  TbParkingCircle,
  TbArmchair,
  TbX,
} from 'react-icons/tb';
import { Label } from '@/components/shadcn/label';
import InfiniteScroll from 'react-infinite-scroll-component';

dayjs.extend(relativeTime);

const PropertySkeleton = ({ count }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
    {[...Array(count)].map((_, index) => (
      <div
        key={index}
        className="w-full shadow-lg hover:shadow-xl transition-shadow p-4 bg-white rounded-xl"
      >
        <div className="space-y-4">
          <Skeleton className="h-56 w-full object-cover rounded-lg bg-gray-200" />
          <Skeleton className="h-6 w-3/4 bg-gray-200 rounded" />
          <Skeleton className="h-4 w-2/3 bg-gray-200 rounded" />
          <Skeleton className="h-4 w-1/2 bg-gray-200 rounded" />
        </div>
      </div>
    ))}
  </div>
);

const PropertyCard = ({ property }) => (
  <Card className="shadow-md hover:shadow-xl transition-shadow rounded-xl overflow-hidden border">
    <CardContent className="p-0">
      <Link to={`/properties/${property.id}`}>
        <img
          src={property.images[0]}
          alt={property.name}
          className="w-full h-56 object-cover"
        />
      </Link>
    </CardContent>
    <CardHeader className="p-4 space-y-2">
      <div className="flex justify-between items-start gap-2">
        <CardTitle className="capitalize text-lg font-semibold">
          <Link to={`/properties/${property.id}`} className="hover:underline">
            {property.name}
          </Link>
        </CardTitle>
        {property.offer && (
          <Badge
            variant="destructive"
            className="text-xs md:text-sm whitespace-nowrap"
          >
            {Math.round(
              ((property.regularPrice - property.discountPrice) /
                property.regularPrice) *
                100
            )}
            % OFF
          </Badge>
        )}
      </div>
      <div className="text-body text-sm flex items-center gap-2">
        <TbMapPin className="text-base" />
        <span className="line-clamp-1">{property.address}</span>
      </div>
      <div className="text-xs text-muted-foreground">
        {dayjs(property.createdAt).fromNow()} • {property.type.toUpperCase()}
      </div>
      <CardDescription className="text-sm mt-2 text-body line-clamp-2">
        {property.description}
      </CardDescription>
      <div className="flex flex-wrap gap-4 text-sm mt-2">
        <div className="flex items-center gap-1">
          <TbBed /> {property.bedroom}
        </div>
        <div className="flex items-center gap-1">
          <TbBath /> {property.bathroom}
        </div>
        <div className="flex items-center gap-1">
          <TbArmchair /> {property.furnished ? 'Furnished' : 'Unfurnished'}
        </div>
        <div className="flex items-center gap-1">
          <TbParkingCircle /> {property.parking ? 'Parking' : 'No Parking'}
        </div>
      </div>
    </CardHeader>
    <CardFooter className="flex justify-between items-center px-4 pb-4">
      <div className="text-base">
        <span className="text-success font-bold">
          $
          {property?.discountPrice?.toLocaleString() ??
            property.regularPrice.toLocaleString()}
        </span>
        {property.discountPrice && (
          <span className="line-through ml-2 text-body text-sm">
            ${property.regularPrice.toLocaleString()}
          </span>
        )}
      </div>
      <Button asChild>
        <Link to={`/properties/${property.id}`}>View</Link>
      </Button>
    </CardFooter>
  </Card>
);

const PropertyFilter = ({ onChange }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    q: '',
    type: '',
    minPrice: undefined,
    maxPrice: undefined,
    minBedroom: undefined,
    maxBedroom: undefined,
    minBathroom: undefined,
    maxBathroom: undefined,
    offer: undefined,
    furnished: undefined,
    parking: undefined,
    sortBy: 'latest',
  });

  useEffect(() => {
    onChange?.(filters);
  }, [filters, onChange]);

  const handleResetFilters = () => {
    setFilters({
      q: '',
      type: '',
      minPrice: undefined,
      maxPrice: undefined,
      minBedroom: undefined,
      maxBedroom: undefined,
      minBathroom: undefined,
      maxBathroom: undefined,
      offer: undefined,
      furnished: undefined,
      parking: undefined,
      sortBy: 'latest',
    });
  };

  const handleClearFilter = key => {
    setFilters(prev => ({
      ...prev,
      [key]:
        key === 'sortBy'
          ? 'latest'
          : typeof prev[key] === 'boolean'
          ? undefined
          : '',
    }));
  };

  const filterLabels = {
    type: 'Type',
    minPrice: 'Min Price',
    maxPrice: 'Max Price',
    minBedroom: 'Min Bedroom',
    maxBedroom: 'Max Bedroom',
    minBathroom: 'Min Bathroom',
    maxBathroom: 'Max Bathroom',
    offer: 'Offer',
    furnished: 'Furnished',
    parking: 'Parking',
    sortBy: 'Sort',
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, val]) =>
      key !== 'q' &&
      val !== '' &&
      val !== undefined &&
      (key !== 'sortBy' || val !== 'latest')
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">Filter:</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowFilters(prev => !prev)}
            aria-expanded={showFilters}
            aria-controls="filter-options"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>
        <Input
          placeholder="Search properties..."
          className="max-w-sm"
          value={filters.q}
          onChange={e => setFilters(prev => ({ ...prev, q: e.target.value }))}
        />
      </div>

      {showFilters && (
        <div
          id="filter-options"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
        >
          <Select
            value={filters.type}
            onValueChange={value =>
              setFilters(prev => ({ ...prev, type: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sale">For Sale</SelectItem>
              <SelectItem value="rent">For Rent</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Min Price ($)"
            type="number"
            min="0"
            value={filters.minPrice ?? ''}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                minPrice: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />

          <Input
            placeholder="Max Price ($)"
            type="number"
            min="0"
            value={filters.maxPrice ?? ''}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                maxPrice: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />

          <Input
            placeholder="Min Bedrooms"
            type="number"
            min="0"
            step="1"
            value={filters.minBedroom ?? ''}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                minBedroom: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />

          <Input
            placeholder="Max Bedrooms"
            type="number"
            min="0"
            step="1"
            value={filters.maxBedroom ?? ''}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                maxBedroom: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />

          <Input
            placeholder="Min Bathrooms"
            type="number"
            min="0"
            step="0.5"
            value={filters.minBathroom ?? ''}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                minBathroom: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              }))
            }
          />

          <Input
            placeholder="Max Bathrooms"
            type="number"
            min="0"
            step="0.5"
            value={filters.maxBathroom ?? ''}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                maxBathroom: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              }))
            }
          />

          <div className="flex items-center space-x-2">
            <Switch
              id="offer"
              checked={filters.offer || false}
              onCheckedChange={val =>
                setFilters(prev => ({ ...prev, offer: val }))
              }
            />
            <Label htmlFor="offer">Offer</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="furnished"
              checked={filters.furnished || false}
              onCheckedChange={val =>
                setFilters(prev => ({ ...prev, furnished: val }))
              }
            />
            <Label htmlFor="furnished">Furnished</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="parking"
              checked={filters.parking || false}
              onCheckedChange={val =>
                setFilters(prev => ({ ...prev, parking: val }))
              }
            />
            <Label htmlFor="parking">Parking</Label>
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {Object.entries(filters)
            .filter(
              ([key, val]) => key !== 'q' && val !== '' && val !== undefined
            )
            .map(([key, val]) => (
              <div
                key={key}
                className="flex items-center bg-blue-100 text-blue-700 text-sm px-2 py-1 rounded-full"
              >
                <span>
                  {filterLabels[key]}:{' '}
                  {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val}
                </span>
                <button
                  type="button"
                  className="ml-1 hover:text-red-500 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-full"
                  onClick={() => handleClearFilter(key)}
                  aria-label={`Remove ${filterLabels[key]} filter`}
                >
                  <TbX className="size-4 text-red-500" />
                </button>
              </div>
            ))}
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-600"
            onClick={handleResetFilters}
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
};

const Home = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [properties, setProperties] = useState([]);
  const [hasMore, setHasMore] = useState(true);

  const { data, isLoading, isError } = useSearchPropertiesQuery({
    limit: 10,
    page: currentPage,
    ...filters,
  });

  useEffect(() => {
    setCurrentPage(1);
    setProperties([]);
    setHasMore(true);
  }, [filters]);

  useEffect(() => {
    if (data?.data) {
      setProperties(prev => {
        const newData = data.data.filter(
          newItem => !prev.some(item => item.id === newItem.id)
        );
        return currentPage === 1 ? data.data : [...prev, ...newData];
      });

      setHasMore(data.data.length >= 10);
    }
  }, [data, currentPage]);

  useEffect(() => {
    if (isError) setHasMore(false);
  }, [isError]);

  const fetchMoreData = () => {
    if (!isLoading && hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return (
    <div className="self-start w-full px-4 md:px-8 py-6 space-y-6">
      <PropertyFilter onChange={setFilters} />

      {isError && (
        <p className="text-red-500 text-center">
          Failed to load properties. Please try again.
        </p>
      )}

      <InfiniteScroll
        dataLength={properties.length}
        next={fetchMoreData}
        hasMore={hasMore && !isError}
        loader={<PropertySkeleton count={2} />}
        scrollThreshold={0.9}
        endMessage={
          properties.length > 0 && (
            <p className="text-center text-gray-500 mt-4">
              You've seen all properties
            </p>
          )
        }
      >
        <div className="space-y-6">
          {isLoading && currentPage === 1 ? (
            <PropertySkeleton count={4} />
          ) : properties.length === 0 && !isLoading ? (
            <p className="text-body font-semibold text-2xl mb-8 text-center">
              No properties found.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map(property => (
                <PropertyCard key={property?.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </InfiniteScroll>
    </div>
  );
};

export default Home;
