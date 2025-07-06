/* eslint-disable react-hooks/exhaustive-deps */
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import useFormHandler from '@/hooks/useFormHandler';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from '@/components/shadcn/select';
import {
  Form,
  FormField,
  FormLabel,
  FormMessage,
  FormItem,
  FormControl,
} from '@/components/shadcn/form';
import { useState, useEffect } from 'react';
import { Textarea } from '@/components/shadcn/textarea';
import { Checkbox } from '@/components/shadcn/checkbox';
import { cn } from '@/lib/utils';
import { TbLoader } from 'react-icons/tb';
import { toast } from 'react-hot-toast';
import {
  useUploadPropertyImageMutation,
  useRemovePropertyImageMutation,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useShowPropertyQuery,
} from '@/services/propertyApi';
import { Skeleton } from '@/components/shadcn/skeleton';

const PropertySkeleton = ({isCreate}) => (
  <div className="space-y-4">
    {!isCreate && (
      <div className="flex justify-center">
        <Skeleton className="h-32 w-32 rounded-full" />
      </div>
    )}
    <Skeleton className="h-4 w-[120px]" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-4 w-[120px]" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-4 w-[120px]" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-4 w-[120px]" />
    <Skeleton className="h-10 w-full" />
    <div className="flex justify-end gap-2">
      <Skeleton className="h-10 w-24 rounded-md" />
      <Skeleton className="h-10 w-24 rounded-md" />
    </div>
  </div>
);

const PropertyForm = ({ id, onSubmitComplete, onCancel, isCreate}) => {
  const { data: property, isLoading: isPropertyLoading } =
    useShowPropertyQuery(id, {
      skip: isCreate || !id,
    });
  const [previewImages, setPreviewImages] = useState([]);
  const [images, setImages] = useState([]);
  const [imageToRemove, setImageToRemove] = useState('');
  const [removeImage, { isLoading: isRemoveImageLoading }] =
    useRemovePropertyImageMutation();
  const {
    form: formUpload,
    handleSubmit: handleSubmitUpload,
    isLoading: isUploadLoading,
  } = useFormHandler({
    fileFieldname: 'images',
    isMultiple: true,
    params: [{ name: 'propertyId', value: id }],
    mutation: useUploadPropertyImageMutation,
    defaultValues: { images: ''}
  });
  const { form, handleSubmit, isLoading } = useFormHandler({
    isCreate,
    fileFieldname: 'images',
    isMultiple: true,
    mutation: isCreate
      ? useCreatePropertyMutation
      : useUpdatePropertyMutation,
    ...(!isCreate && {
      params: [{ name: 'propertyId', value: id }],
    }),
    onSubmitComplete,
    defaultValues: {
      name: '',
      description: '',
      address: '',
      regularPrice: '',
      discountPrice: '',
      type: '',
      bedroom: '',
      bathroom: '',
      parking: false,
      furnished: false,
      offer: false,
    },
  });

  const handleImageChange = e => {
    const selectedFiles = e.target.files;

    if (selectedFiles) {
      const fileArray = Array.from(selectedFiles);
      const previewUrls = fileArray.map(file => URL.createObjectURL(file));

      setImages(prev => [...prev, ...fileArray]);
      setPreviewImages(prev => [...prev, ...previewUrls]);
    }
  };

  const handleRemoveImage = index => {
    const imageUrl = previewImages[index];
    setImageToRemove(imageUrl);

    if (imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
      setPreviewImages(prev => {
        const copy = [...prev];
        copy.splice(index, 1);
        return copy;
      });
      setImages(prev => {
        const copy = [...prev];
        copy.splice(index, 1);
        return copy;
      });
      setImageToRemove('');
      return;
    }

    removeImage({
      propertyId: id,
      data: { image: imageUrl },
    })
      .unwrap()
      .then(res => {
        toast.success(res.message);

        setPreviewImages(prev => {
          const copy = [...prev];
          copy.splice(index, 1);
          return copy;
        });
        setImages(prev => {
          const copy = [...prev];
          copy.splice(index, 1);
          return copy;
        });
      })
      .catch(e => {
        toast.error(e.message);
      })
      .finally(() => {
        setImageToRemove('');
      });
  };

  useEffect(() => {
    if (isCreate) {
      form.setValue('images', images);
    } else {
      formUpload.setValue('images', images);
    }
  }, [images]);

  useEffect(() => {
    if (!isCreate && property?.data) {
      setPreviewImages(property.data.images);
      form.reset({
         name: property.data.name,
      description: property.data.description,
      address: property.data.address,
      regularPrice: property.data.regularPrice,
      discountPrice: property.data.discountPrice,
      type: property.data.type,
      bedroom: property.data.name,
      bathroom: property.data.bathroom,
      parking: property.data.parking,
      furnished: property.data.furnished,
      offer: property.data.offer,
      });
    }
  }, [property]);

  if (isPropertyLoading) return <PropertySkeleton />;

  return (
    <div
      className={cn(
        'flex flex-col md:flex-row gap-x-6 gap-y-12',
        isCreate && 'sm:max-w-lg'
      )}
    >
      {!isCreate && (
        <Form {...formUpload}>
          <form
            className="flex flex-col space-y-4 flex-1"
            onSubmit={handleSubmitUpload}
          >
            <FormField
              control={formUpload.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Images</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={e => handleImageChange(e)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {previewImages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {previewImages.map((src, index) => (
                  <div
                    key={index}
                    className="relative w-32 h-32 border rounded overflow-hidden"
                  >
                    {imageToRemove === src && isRemoveImageLoading ? (
                      <div className="absolute top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center">
                        <TbLoader className="animate-spin" />
                      </div>
                    ) : (
                      <img
                        src={src}
                        alt={`Preview ${index}`}
                        className="object-cover w-full h-full"
                      />
                    )}

                    <button
                      type="button"
                      disabled={isRemoveImageLoading}
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 opacity-80 hover:opacity-100"
                    >
                      remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={isUploadLoading}>
                {isUploadLoading ? (
                  <>
                    <TbLoader className="animate-spin" />
                    Uploading..
                  </>
                ) : (
                  'Upload'
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}

      <Form {...form}>
        <form className="space-y-4 flex-1" onSubmit={handleSubmit}>
          {isCreate && (
            <>
              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Images</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={e => handleImageChange(e)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {previewImages.length > 0 && (
                <div className="flex flex-wrap gap-4 mt-4">
                  {previewImages.map((src, index) => (
                    <div
                      key={index}
                      className="relative w-32 h-32 border rounded overflow-hidden"
                    >
                      <img
                        src={src}
                        alt={`Preview ${index}`}
                        className="object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 opacity-80 hover:opacity-100"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select
                  key={field.value}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a type of property" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-x-6">
            <FormField
              control={form.control}
              name="bedroom"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Bedroom</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bathroom"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Bathroom</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex gap-x-6">
            <FormField
              control={form.control}
              name="regularPrice"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Regular Price</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type="number" {...field} className="pr-8" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discountPrice"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Discount Price</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type="number" {...field} className="pr-8" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex items-center gap-6">
            <FormField
              control={form.control}
              name="furnished"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Furnished</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parking"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Parking</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="offer"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Offer</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-end gap-x-2">
            <Button variant="secondary" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <TbLoader className="animate-spin" />
                  {isCreate ? 'Creating..' : 'Updating..'}
                </>
              ) : isCreate ? (
                'Create'
              ) : (
                'Update'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PropertyForm;
