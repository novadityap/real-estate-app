import { createApi } from '@reduxjs/toolkit/query/react';
import axiosBaseQuery from '@/app/baseQuery.js';
import buildFormData from '@/utils/buildFormData.js';

const propertyApi = createApi({
  reducerPath: 'propertyApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Property'],
  endpoints: builder => ({
    uploadPropertyImage: builder.mutation({
      query: ({ data, propertyId }) => ({
        url: `/properties/${propertyId}/images`,
        method: 'POST',
        data: buildFormData(data, {
          fileFields: 'images',
          isMultiple: true,
        }),
        headers: { 'Content-Type': 'multipart/form-data' }
      }),
      invalidatesTags: [{ type: 'Property', id: 'LIST' }],
    }),
    createProperty: builder.mutation({
      query: data => ({
        url: '/properties',
        method: 'POST',
        data: buildFormData(data, {
          fileFields: 'images',
          isMultiple: true,
        }),
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
      invalidatesTags: [{ type: 'Property', id: 'LIST' }],
    }),
    searchProperties: builder.query({
      query: params => ({
        url: '/properties/search',
        method: 'GET',
        params,
      }),
      providesTags: result =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Property', id })),
              { type: 'Property', id: 'LIST' },
            ]
          : [{ type: 'Property', id: 'LIST' }],
    }),
    showProperty: builder.query({
      query: propertyId => ({
        url: `/properties/${propertyId}`,
        method: 'GET',
      }),
      providesTags: (result, error, propertyId) => [
        { type: 'Property', id: propertyId },
      ],
    }),
    updateProperty: builder.mutation({
      query: ({ data, propertyId }) => ({
        url: `/properties/${propertyId}`,
        method: 'PATCH',
        data,
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
      invalidatesTags: (result, error, { propertyId }) => [
        { type: 'Property', id: propertyId },
        { type: 'Property', id: 'LIST' },
      ],
    }),
    removeProperty: builder.mutation({
      query: propertyId => ({
        url: `/properties/${propertyId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, propertyId) => [
        { type: 'Property', id: propertyId },
        { type: 'Property', id: 'LIST' },
      ],
    }),
    removePropertyImage: builder.mutation({
      query: ({ propertyId, data }) => ({
        url: `/properties/${propertyId}/images`,
        method: 'DELETE',
        data,
      }),
      invalidatesTags: (result, error, propertyId) => [
        { type: 'Property', id: propertyId },
        { type: 'Property', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useSearchPropertiesQuery,
  useLazySearchPropertiesQuery,
  useShowPropertyQuery,
  useLazyShowPropertyQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useRemovePropertyMutation,
  useUploadPropertyImageMutation,
  useRemovePropertyImageMutation,
} = propertyApi;

export default propertyApi;
