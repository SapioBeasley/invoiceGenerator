import React from 'react';
import { useFormContext } from 'react-hook-form';
import { DocumentFormData, TableData } from '@/types/documentGenerator';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  sectionKey: keyof DocumentFormData;
}

export const SectionTableEditor: React.FC<Props> = ({ sectionKey }) => {
  const { watch, setValue } = useFormContext<DocumentFormData>();
  const tablePath = `sectionTables.${sectionKey}` as any;
  const tableData = watch(tablePath) as TableData;

  if (!tableData) return null;

  const recalculateAverages = (data: TableData): TableData => {
    const newAverages = data.averages.map((avg, cIdx) => {
      if (cIdx === 0) return { value: avg.value || 'Average' };

      const colValues = data.rows
        .map((r) => r.cols[cIdx]?.value)
        .filter((v) => v !== undefined && v.trim() !== '');

      if (colValues.length === 0) return { value: '' };

      let sum = 0;
      let count = 0;
      for (const val of colValues) {
        const num = parseFloat(val);
        if (!isNaN(num)) {
          sum += num;
          count++;
        }
      }

      if (count === 0) return { value: '' };
      const average = sum / count;
      return {
        value: Number.isInteger(average)
          ? average.toString()
          : average.toFixed(2),
      };
    });

    return { ...data, averages: newAverages };
  };

  const setTable = (newData: TableData) => setValue(tablePath, newData);

  if (!tableData.enabled) {
    return (
      <div className='mt-3 flex items-center gap-2'>
        <input
          type='checkbox'
          checked={false}
          onChange={(e) =>
            setTable({ ...tableData, enabled: e.target.checked })
          }
          className='w-4 h-4'
        />
        <label className='text-sm font-medium text-gray-700'>
          Include Table
        </label>
      </div>
    );
  }

  const addColumn = () => {
    const newData = { ...tableData };
    newData.headers = [...newData.headers, { value: 'New Col' }];
    newData.rows = newData.rows.map((r) => ({
      cols: [...r.cols, { value: '' }],
    }));
    newData.averages = [...newData.averages, { value: '' }];
    newData.objectives = [...newData.objectives, { value: '' }];
    setTable(recalculateAverages(newData));
  };

  const removeColumn = (idx: number) => {
    if (tableData.headers.length <= 1) return;
    const newData = { ...tableData };
    newData.headers = newData.headers.filter((_, i) => i !== idx);
    newData.rows = newData.rows.map((r) => ({
      cols: r.cols.filter((_, i) => i !== idx),
    }));
    newData.averages = newData.averages.filter((_, i) => i !== idx);
    newData.objectives = newData.objectives.filter((_, i) => i !== idx);
    setTable(recalculateAverages(newData));
  };

  const addRow = () => {
    const newData = { ...tableData };
    newData.rows = [
      ...newData.rows,
      { cols: tableData.headers.map(() => ({ value: '' })) },
    ];
    setTable(recalculateAverages(newData));
  };

  const removeRow = (idx: number) => {
    if (tableData.rows.length <= 1) return;
    const newData = { ...tableData };
    newData.rows = newData.rows.filter((_, i) => i !== idx);
    setTable(recalculateAverages(newData));
  };

  return (
    <div className='mt-4 border rounded-md p-4 bg-gray-50 overflow-x-auto'>
      <div className='flex items-center justify-between mb-4'>
        <label className='text-sm font-medium flex items-center gap-2'>
          <input
            type='checkbox'
            checked={tableData.enabled}
            onChange={(e) =>
              setTable({ ...tableData, enabled: e.target.checked })
            }
            className='w-4 h-4'
          />
          Include Table
        </label>
        <div className='flex gap-2'>
          <button
            type='button'
            onClick={addColumn}
            className='text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-blue-200'
          >
            <Plus size={14} /> Column
          </button>
          <button
            type='button'
            onClick={addRow}
            className='text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-blue-200'
          >
            <Plus size={14} /> Row
          </button>
        </div>
      </div>

      <table className='w-full text-left border-collapse bg-white shadow-sm rounded-md overflow-hidden'>
        <thead>
          <tr className='bg-gray-100'>
            {tableData.headers.map((h, i) => (
              <th key={i} className='border p-2 min-w-[120px]'>
                <div className='flex items-center gap-1'>
                  <input
                    className='w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:outline-none focus:border-blue-500 text-sm font-semibold p-1'
                    value={h.value}
                    onChange={(e) => {
                      const newData = { ...tableData };
                      newData.headers[i].value = e.target.value;
                      setTable(newData);
                    }}
                  />
                  <button
                    type='button'
                    onClick={() => removeColumn(i)}
                    className='text-gray-400 hover:text-red-500 transition-colors'
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </th>
            ))}
            <th className='w-10 border p-2 text-center bg-gray-100'></th>
          </tr>
        </thead>
        <tbody>
          {tableData.rows.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.cols.map((col, cIdx) => (
                <td key={cIdx} className='border p-2'>
                  <input
                    className='w-full border-b border-transparent hover:border-gray-200 focus:outline-none focus:border-blue-500 text-sm p-1'
                    value={col.value}
                    placeholder={`Row ${rIdx + 1}`}
                    onChange={(e) => {
                      const newData = { ...tableData };
                      newData.rows[rIdx].cols[cIdx].value = e.target.value;
                      setTable(recalculateAverages(newData));
                    }}
                  />
                </td>
              ))}
              <td className='border p-2 text-center'>
                <button
                  type='button'
                  onClick={() => removeRow(rIdx)}
                  className='text-gray-400 hover:text-red-500 transition-colors'
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
          {/* Averages Row */}
          <tr className='bg-gray-50 border-t-2 border-gray-200'>
            {tableData.averages.map((avg, cIdx) => (
              <td key={cIdx} className='border p-2'>
                <input
                  className={`w-full border-b border-transparent focus:outline-none text-sm p-1 bg-transparent font-medium ${cIdx === 0 ? 'hover:border-gray-300 focus:border-blue-500' : 'text-gray-500 cursor-not-allowed'}`}
                  value={avg.value}
                  placeholder='Average...'
                  readOnly={cIdx !== 0}
                  onChange={(e) => {
                    if (cIdx !== 0) return;
                    const newData = { ...tableData };
                    newData.averages[cIdx].value = e.target.value;
                    setTable(newData);
                  }}
                />
              </td>
            ))}
            <td className='border p-2 bg-gray-50'></td>
          </tr>
          {/* Objectives Row */}
          <tr className='bg-gray-50'>
            {tableData.objectives.map((obj, cIdx) => (
              <td key={cIdx} className='border p-2'>
                <input
                  className='w-full border-b border-transparent hover:border-gray-300 focus:outline-none focus:border-blue-500 text-sm p-1 bg-transparent font-medium text-blue-700'
                  value={obj.value}
                  placeholder='Objective...'
                  onChange={(e) => {
                    const newData = { ...tableData };
                    newData.objectives[cIdx].value = e.target.value;
                    setTable(newData);
                  }}
                />
              </td>
            ))}
            <td className='border p-2 bg-gray-50'></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
