import { useParams } from 'react-router';
import { useShowPropertyQuery } from '@/services/propertyApi';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import {
  TbMapPin,
  TbBed,
  TbBath,
  TbParkingCircle,
  TbArmchair,
} from 'react-icons/tb';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/card';
import { Textarea } from '@/components/shadcn/textarea';
import { Button } from '@/components/shadcn/button';
import { useState } from 'react';
import { Skeleton } from '@/components/shadcn/skeleton';
import { Badge } from '@/components/shadcn/badge';
import { Separator } from '@/components/shadcn/separator';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const PropertySkeleton = () => {
  return (
    <div className="w-full px-4 space-y-4">
      <Skeleton className="w-full h-56 rounded-xl" />
      <Card className="rounded-xl">
        <CardContent className="p-4 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
          <div className="pt-4 space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-4 w-48" />
        </CardContent>
      </Card>
      <Card className="rounded-xl">
        <CardContent className="p-4 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
};

const PropertyDetail = () => {
  const { propertyId } = useParams();
  const { data: property, isLoading } = useShowPropertyQuery(propertyId);
  const [message, setMessage] = useState('');

  if (isLoading) return <PropertySkeleton />;

  return (
    <div className="w-full px-4 space-y-4 md:max-w-5xl md:mx-auto md:space-y-6 md:px-6">
      <div className="rounded-xl overflow-hidden shadow">
        <Swiper
          slidesPerView={1}
          spaceBetween={30}
          loop={true}
          pagination={{ clickable: true }}
          navigation={true}
          modules={[Pagination, Navigation]}
        >
          {property?.data?.images?.map((image, index) => (
            <SwiperSlide key={index}>
              <img
                src={image}
                alt={`Property ${index}`}
                className="w-full h-52 sm:h-80 md:h-96 object-cover"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <Card className="rounded-xl">
        <CardHeader className="pb-0 px-4 pt-4">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-xl font-semibold md:text-2xl line-clamp-2">
              {property?.data?.name}
            </CardTitle>
            {property?.data?.offer && (
              <Badge
                variant="destructive"
                className="text-xs md:text-sm whitespace-nowrap"
              >
                {Math.round(
                  ((property?.data?.regularPrice -
                    property?.data?.discountPrice) /
                    property?.data?.regularPrice) *
                    100
                )}
                % OFF
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4 md:p-6">
          <div className="text-muted-foreground flex items-start gap-2 text-sm md:text-base">
            <TbMapPin className="flex-shrink-0 mt-0.5 text-lg" />
            <span className="line-clamp-2">{property?.data?.address}</span>
          </div>
          <div className="text-sm md:text-base text-muted-foreground">
            {dayjs(property?.data?.createdAt).fromNow()} •{' '}
            {property?.data?.type.toUpperCase()}
          </div>
          <Separator className="my-3 md:my-4" />
          <div className="text-sm text-body leading-relaxed md:text-base">
            {property?.data?.description}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4 md:pt-4">
            <div className="flex items-center gap-2 text-sm md:text-base">
              <TbBed className="text-primary flex-shrink-0" />
              <span>
                {property?.data?.bedroom}{' '}
                {property?.data?.bedroom > 1 ? 'Bedrooms' : 'Bedroom'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm md:text-base">
              <TbBath className="text-primary flex-shrink-0" />
              <span>
                {property?.data?.bathroom}{' '}
                {property?.data?.bathroom > 1 ? 'Bathrooms' : 'Bathroom'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm md:text-base">
              <TbParkingCircle className="text-primary flex-shrink-0" />
              <span>{property?.data?.parking ? 'Parking' : 'No Parking'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm md:text-base">
              <TbArmchair className="text-primary flex-shrink-0" />
              <span>
                {property?.data?.furnished ? 'Furnished' : 'Unfurnished'}
              </span>
            </div>
          </div>

          <Separator className="my-3 md:my-4" />

          <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:justify-between sm:items-center md:pt-4">
            <div className="space-y-1 md:space-y-2">
              <p className="text-base font-medium md:text-lg">
                {property?.data?.offer ? (
                  <>
                    <span className="font-bold text-green-600">
                      ${property?.data?.discountPrice.toLocaleString()}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground line-through md:text-sm">
                      ${property?.data?.regularPrice.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className="font-bold text-green-600">
                    ${property?.data?.regularPrice.toLocaleString()}
                  </span>
                )}
              </p>
              {property?.data?.offer && (
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-600 text-xs md:text-sm"
                >
                  Save ${' '}
                  {(
                    property?.data?.regularPrice - property?.data?.discountPrice
                  ).toLocaleString()}
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground md:text-sm">
              <p>
                Owner:{' '}
                <span className="font-medium">
                  {property?.data?.owner?.name || property?.data?.owner?.email}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-xl">
        <CardHeader className="px-4 pt-4 pb-0 md:px-6 md:pt-6">
          <CardTitle className="text-lg md:text-xl">Contact Owner</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3 md:p-6 md:space-y-4">
          <Textarea
            placeholder={`Hi, I'm interested in ${property?.data?.name}...`}
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            className="text-sm md:text-base"
          />
          <a
            href={`mailto:$
              {property?.data?.owner?.email}
              ?subject=Inquiry about ${property?.data?.name}
              &body=${encodeURIComponent(message)}`}
            className="w-full md:w-auto"
          >
            <Button type="button" className="w-full md:w-auto">
              Send Message
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyDetail;
