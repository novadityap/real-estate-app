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

const PropertyForm = ({
  initialValues,
  mutation,
  uploadImageMutation,
  removeImageMutation,
  onComplete,
  onCancel,
  isCreate,
}) => {
  const [previewImages, setPreviewImages] = useState([]);
  const [images, setImages] = useState([]);
  const [removingImageUrl, setRemovingImageUrl] = useState('');
  const [removeImage, { isLoading: isLoadingRemoveImage }] =
    removeImageMutation();
  const {
    form: formUpload,
    handleSubmit: handleSubmitUpload,
    isLoading: isLoadingUpload,
  } = useFormHandler({
    params: [{ name: 'propertyId', value: initialValues.id }],
    mutation: uploadImageMutation,
    defaultValues: { images: ''}
  });
  const { form, handleSubmit, isLoading } = useFormHandler({
    formType: 'datatable',
    ...(!isCreate && {
      params: [{ name: 'propertyId', value: initialValues.id }],
    }),
    mutation,
    onComplete,
    defaultValues: {
      images: '',
      name: initialValues.name ?? '',
      description: initialValues.description ?? '',
      address: initialValues.address ?? '',
      regularPrice: initialValues.regularPrice ?? '',
      discountPrice: initialValues.discountPrice ?? '',
      type: initialValues.type ?? '',
      bedroom: initialValues.bedroom ?? '',
      bathroom: initialValues.bathroom ?? '',
      parking: initialValues.parking ?? false,
      furnished: initialValues.furnished ?? false,
      offer: initialValues.offer ?? false,
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
    const updatedImages = [...images];
    const updatedPreviews = [...previewImages];

    const removedPreview = updatedPreviews[index];

    updatedImages.splice(index, 1);
    updatedPreviews.splice(index, 1);

    URL.revokeObjectURL(removedPreview);

    setRemovingImageUrl(removedPreview);
    setImages(updatedImages);

    if (isCreate) setPreviewImages(updatedPreviews);

    if (!isCreate) {
      removeImage({
        propertyId: initialValues.id,
        data: {
          image: removedPreview,
        },
      })
        .unwrap()
        .then(res => {
          setPreviewImages(updatedPreviews);
          setRemovingImageUrl('');
          toast.success(res.message);
        })
        .catch(e => toast.error(e.message));
    }
  };

  useEffect(() => {
    if (!isCreate) setPreviewImages(initialValues.images);
  }, []);

  useEffect(() => {
    if (isCreate) {
      form.setValue('images', images);
    } else {
      formUpload.setValue('images', images);
    }
  }, [images]);

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
                    {removingImageUrl === src && isLoadingRemoveImage ? (
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
                      disabled={isLoadingRemoveImage}
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
              <Button type="submit" disabled={isLoadingUpload}>
                {isLoadingUpload ? (
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
                  defaultValue={field.value}
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
