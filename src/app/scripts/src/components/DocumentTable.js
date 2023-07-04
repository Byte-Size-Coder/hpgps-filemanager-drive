import React, { useState } from 'react';

import DebouncedInput from './DebouncedInput';
import Filter from './Filter';

import {
	useReactTable,
	getCoreRowModel,
	getFilteredRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFacetedMinMaxValues,
	getPaginationRowModel,
	getSortedRowModel,
	flexRender,
} from '@tanstack/react-table';

import { columns, fuzzyFilter } from '../utils/table-helper';

import '../../../styles/app.css';

const DocumentTable = ({ files }) => {
	const [columnFilters, setColumnFilters] = useState([]);
	const [globalFilter, setGlobalFilter] = useState('');

	const table = useReactTable({
		data: files,
		columns,
		filterFns: {
			fuzzy: fuzzyFilter,
		},
		state: {
			columnFilters,
			globalFilter,
		},
		onColumnFiltersChange: setColumnFilters,
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: fuzzyFilter,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getFacetedMinMaxValues: getFacetedMinMaxValues(),
		debugTable: true,
		debugHeaders: true,
		debugColumns: false,
	});

	return (
		<div
			style={{
				marginTop: '2rem',
				display: 'flex',
				flexDirection: 'column',
				gap: '1rem',
				width: '100%',
			}}
		>
			<div>
				<DebouncedInput
					value={globalFilter ?? ''}
					onChange={(value) => setGlobalFilter(String(value))}
					className="geotabFormEditField"
					placeholder="Search all columns..."
				/>
			</div>
			<div style={{ width: '100%' }}>
				<table style={{ width: '100%' }}>
					<thead>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<th key={header.id} colSpan={header.colSpan}>
											{header.isPlaceholder ? null : (
												<>
													<div
														{...{
															className: header.column.getCanSort()
																? 'cursor-pointer select-none'
																: '',
															onClick:
																header.column.getToggleSortingHandler(),
														}}
													>
														{flexRender(
															header.column.columnDef.header,
															header.getContext()
														)}
														{{
															asc: ' 🔼',
															desc: ' 🔽',
														}[header.column.getIsSorted()] ?? null}
													</div>
													{header.id !== 'action' ? (
														<div>
															<Filter
																column={header.column}
																table={table}
															/>
														</div>
													) : null}
												</>
											)}
										</th>
									);
								})}
							</tr>
						))}
					</thead>
					<tbody>
						{table.getRowModel().rows.map((row, index) => {
							return (
								<tr
									key={row.id}
									className={
										index % 2 === 0
											? 'geotabPrimaryFill cell-overflow'
											: 'geotabSecondaryFill cell-overflow'
									}
								>
									{row.getVisibleCells().map((cell) => {
										return (
											<td
												key={cell.id}
												className="geotabPrimaryText"
												style={{ padding: '1rem' }}
											>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext()
												)}
											</td>
										);
									})}
								</tr>
							);
						})}
					</tbody>
				</table>
				{files.length > table.getState().pagination.pageSize && (
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '0.5rem',
							marginTop: '0.25rem',
						}}
						className="geotabSecondaryText"
					>
						<button
							className="geotabButton pagenation-button"
							onClick={() => table.setPageIndex(0)}
							disabled={!table.getCanPreviousPage()}
						>
							{'<<'}
						</button>
						<button
							className="geotabButton pagenation-button"
							onClick={() => table.previousPage()}
							disabled={!table.getCanPreviousPage()}
						>
							{'<'}
						</button>
						<button
							className="geotabButton pagenation-button"
							onClick={() => table.nextPage()}
							disabled={!table.getCanNextPage()}
						>
							{'>'}
						</button>
						<button
							className="geotabButton pagenation-button"
							onClick={() => table.setPageIndex(table.getPageCount() - 1)}
							disabled={!table.getCanNextPage()}
						>
							{'>>'}
						</button>
						<span className="pagenation-foot">
							<div>Page</div>
							<strong>
								{table.getState().pagination.pageIndex + 1} of{' '}
								{table.getPageCount()}
							</strong>
						</span>
						<span className="pagenation-foot">
							| Go to page:
							<input
								type="number"
								defaultValue={table.getState().pagination.pageIndex + 1}
								onChange={(e) => {
									const page = e.target.value ? Number(e.target.value) - 1 : 0;
									table.setPageIndex(page);
								}}
								className="geotabFormEditField"
							/>
						</span>
						<select
							value={table.getState().pagination.pageSize}
							onChange={(e) => {
								table.setPageSize(Number(e.target.value));
							}}
							className="geotabFormEditField"
						>
							{[10, 20, 30, 40, 50].map((pageSize) => (
								<option key={pageSize} value={pageSize}>
									Show {pageSize}
								</option>
							))}
						</select>
						<div>{table.getPrePaginationRowModel().rows.length} Rows</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default DocumentTable;
