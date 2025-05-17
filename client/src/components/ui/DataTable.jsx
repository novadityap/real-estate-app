import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@/components/shadcn/table';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { createColumnHelper } from '@tanstack/react-table';
import { TbEdit, TbTrash, TbPlus, TbLoader } from 'react-icons/tb';
import { Input } from '@/components/shadcn/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/shadcn/dialog';
import { Button } from '@/components/shadcn/button';
import { Skeleton } from '@/components/shadcn/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import dayjs from 'dayjs';
import ReactPaginate from 'react-paginate';
import { cn } from '@/lib/utils';

const Pagination = ({ pageCount, onPageChange, currentPage, forcePage }) => (
  <ReactPaginate
    forcePage={forcePage}
    previousLabel={<span className="">Prev</span>}
    nextLabel={<span className="">Next</span>}
    breakLabel={'...'}
    pageCount={pageCount}
    marginPagesDisplayed={2}
    pageRangeDisplayed={5}
    onPageChange={onPageChange}
    containerClassName={'flex items-center space-x-2'}
    pageLinkClassName={
      'px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors'
    }
    activeLinkClassName={
      'text-purple-600 border border-purple-600 bg-white rounded-md'
    }
    breakClassName={'px-3 py-2 text-gray-700'}
    previousLinkClassName={cn(
      'px-3 py-2 rounded-md transition-colors',
      currentPage === 0
        ? 'text-gray-300 bg-gray-100 cursor-not-allowed'
        : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
    )}
    nextLinkClassName={cn(
      'px-3 py-2 rounded-md transition-colors',
      currentPage === pageCount - 1
        ? 'text-gray-300 bg-gray-100 cursor-not-allowed'
        : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
    )}
    disabledClassName={'pointer-events-none'}
    ariaDisabledClassName={'text-gray-300'}
    pageClassName={'flex items-center'}
  />
);

const ManageItemModal = ({
  isOpen,
  isCreate,
  onToggle,
  title,
  children,
  isRemove,
  onConfirm,
  isLoading,
  entityName,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onToggle}>
      <DialogContent
        className={cn(
          'max-h-[90vh] overflow-y-auto',
          entityName === 'property' && !isCreate && 'md:max-w-4xl'
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isRemove ? 'Are you sure you want to remove this item?' : ''}
          </DialogDescription>
        </DialogHeader>

        {children}
        {isRemove && (
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={onConfirm}>
              {isLoading ? (
                <>
                  <TbLoader className="animate-spin" />
                  <span>Removing...</span>
                </>
              ) : (
                'Remove'
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

const PageSizeSelector = ({ value, onChange }) => (
  <div className="flex items-center gap-x-3 w-16 text-sm">
    <span>Show</span>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="10" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={10}>10</SelectItem>
        <SelectItem value={25}>25</SelectItem>
        <SelectItem value={50}>50</SelectItem>
      </SelectContent>
    </Select>
    <span>entries</span>
  </div>
);

const TableWrapper = ({ table }) => {
  const { getHeaderGroups, getRowModel, getVisibleFlatColumns } = table;
  const emptyRows = 10 - getRowModel().rows.length;

  return (
    <Table>
      <TableHeader>
        {getHeaderGroups().map(headerGroup => (
          <TableRow
            key={headerGroup.id}
            className="bg-gray-600 hover:bg-gray-600"
          >
            {headerGroup.headers.map(header => (
              <TableHead
                key={header.id}
                className="text-gray-50 font-bold border-x-2"
                style={{
                  width: header.column.columnDef.size,
                  minWidth: header.column.columnDef.size,
                  maxWidth: header.column.columnDef.size,
                }}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {getRowModel().rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={getVisibleFlatColumns().length}
              className="h-64 text-center border-0"
            >
              No results.
            </TableCell>
          </TableRow>
        ) : (
          <>
            {getRowModel().rows.map(row => (
              <TableRow key={row.id} className="hover:bg-gray-200/80">
                {row.getVisibleCells().map(cell => (
                  <TableCell
                    key={cell.id}
                    style={{
                      width: cell.column.columnDef.size,
                      minWidth: cell.column.columnDef.size,
                      maxWidth: cell.column.columnDef.size,
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}

            {Array.from({ length: emptyRows }).map((_, index) => (
              <TableRow key={`empty-${index}`} className="border-b-0">
                <TableCell colSpan={getVisibleFlatColumns().length} />
              </TableRow>
            ))}
          </>
        )}
      </TableBody>
    </Table>
  );
};

const LoadingSkeleton = () => (
  <div className="flex flex-col gap-y-4">
    {Array.from({ length: 10 }).map((_, index) => (
      <Skeleton key={`row-skeleton-${index}`} className="h-6" />
    ))}
  </div>
);

const DataTable = ({
  columns,
  searchQuery,
  lazyShowQuery,
  createMutation,
  updateMutation,
  removeMutation,
  uploadImageMutation,
  removeImageMutation,
  FormComponent = null,
  allowCreate = true,
  allowUpdate = true,
  allowFileUpload = false,
  entityName,
  currentUser = {},
}) => {
  const columnsHelper = createColumnHelper();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setcurrentPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [selectedId, setSelectedId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  const {
    data: items,
    isLoading: isLoadingItems,
    isFetching: isFetchingItems,
  } = searchQuery({
    page: searchTerm ? 1 : currentPage + 1,
    limit,
    q: searchTerm,
  });
  const [fetchShowQuery, { data: item }] = lazyShowQuery();
  const [removeMutate, { isLoading: isLoadingRemove }] = removeMutation();
  const totalPages = Math.max(items?.meta?.totalPages || 0, 1);

  const mergedColumns = [
    columnsHelper.display({
      header: '#',
      size: 30,
      cell: info =>
        searchTerm
          ? info.row.index + 1
          : info.row.index + 1 + currentPage * items?.meta?.pageSize,
    }),
    ...columns,
    columnsHelper.accessor('createdAt', {
      header: 'Created At',
      size: 120,
      cell: info => (
        <div className="whitespace-normal break-words text-wrap">
          {dayjs(info.getValue()).format('DD MMM YYYY hh:mm A')}
        </div>
      ),
    }),
    columnsHelper.accessor('updatedAt', {
      header: 'Updated At',
      size: 120,
      cell: info => (
        <div className="whitespace-normal break-words text-wrap">
          {dayjs(info.getValue()).format('DD MMM YYYY hh:mm A')}
        </div>
      ),
    }),
    columnsHelper.display({
      header: 'Actions',
      size: 70,
      cell: ({ row }) => {
        return (
          <div className="flex gap-x-2">
            {allowUpdate && (
              <TbEdit
                className="size-5 cursor-pointer text-orange-600"
                onClick={() => handleUpdate(row.original.id)}
              />
            )}
            <TbTrash
              className="size-5 cursor-pointer text-red-600"
              onClick={() => handleRemove(row.original.id)}
            />
          </div>
        );
      },
    }),
  ];

  const handleModalToggle = open => {
    setIsCreateModalOpen(open);
    setIsUpdateModalOpen(open);
  };

  const handleCreate = () => {
    setSelectedId(null);
    setIsCreateModalOpen(true);
  };

  const handleUpdate = async id => {
    await fetchShowQuery(id);
    setIsUpdateModalOpen(true);
  };

  const handleRemove = id => {
    setSelectedId(id);
    setIsRemoveModalOpen(true);
  };

  const handleCreateComplete = result => {
    setIsCreateModalOpen(false);
    setSelectedId(null);
    toast.success(result.message);
  };

  const handleUpdateComplete = result => {
    setIsUpdateModalOpen(false);
    setSelectedId(null);
    toast.success(result.message);
  };

  const handleRemoveConfirm = async () => {
    try {
      const result = await removeMutate(selectedId).unwrap();

      setIsRemoveModalOpen(false);
      setSelectedId(null);
      toast.success(result.message);
    } catch (e) {
      toast.error('Failed to remove item');
    }
  };

  const handlePageSizeChange = value => {
    setLimit(value);
    setcurrentPage(0);
  };

  const filterItem = ({ items, entityName, currentUser }) => {
    items = items || [];

    if (entityName === 'user' && Object.keys(currentUser).length > 0) {
      return items.filter(user => user.id !== currentUser.id);
    }

    if (entityName === 'property' && Object.keys(currentUser).length > 0) {
      if (currentUser.role === 'admin') {
        return items.filter(property => property.id !== null);
      } else {
        return items.filter(property => property.ownerId === currentUser.id);
      }
    }

    return items;
  };

  const table = useReactTable({
    data: filterItem({ items: items?.data, entityName, currentUser }),
    columns: mergedColumns,
    getCoreRowModel: getCoreRowModel(),
    manualFiltering: true,
    manualPagination: true,
    rowCount: items?.meta?.totalItems || 0,
  });

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Input
          type="text"
          placeholder="Search..."
          className="w-64 lg:w-80"
          onChange={e => setSearchTerm(e.target.value)}
        />
        {allowCreate && (
          <Button onClick={handleCreate}>
            <TbPlus className="mr-2 size-5" />
            Add
          </Button>
        )}
      </div>

      {isLoadingItems || isFetchingItems ? (
        <LoadingSkeleton />
      ) : (
        <TableWrapper table={table} />
      )}

      <div className="flex justify-between mt-4">
        <PageSizeSelector
          value={limit}
          onChange={value => handlePageSizeChange(value)}
        />

        <Pagination
          currentPage={currentPage}
          pageCount={totalPages}
          onPageChange={page => setcurrentPage(page.selected)}
          forcePage={currentPage}
        />
      </div>

      <ManageItemModal
        isOpen={isCreateModalOpen || isUpdateModalOpen}
        onToggle={open => handleModalToggle(open)}
        title={isCreateModalOpen ? 'Create' : 'Update'}
        entityName={entityName}
        isCreate={isCreateModalOpen}
      >
        {FormComponent && (
          <FormComponent
            isCreate={isCreateModalOpen}
            mutation={isCreateModalOpen ? createMutation : updateMutation}
            initialValues={!isCreateModalOpen && item?.data ? item.data : {}}
            onComplete={
              isCreateModalOpen ? handleCreateComplete : handleUpdateComplete
            }
            {...(allowFileUpload && {
              uploadImageMutation,
              removeImageMutation,
            })}
            onCancel={
              isCreateModalOpen
                ? () => setIsCreateModalOpen(false)
                : () => setIsUpdateModalOpen(false)
            }
          />
        )}
      </ManageItemModal>

      <ManageItemModal
        isOpen={isRemoveModalOpen}
        isRemove={true}
        title="Remove"
        onToggle={() => setIsRemoveModalOpen(false)}
        onConfirm={handleRemoveConfirm}
        isLoading={isLoadingRemove}
      />
    </>
  );
};

export default DataTable;
