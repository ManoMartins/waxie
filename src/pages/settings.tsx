import styles from './settings.module.scss';

import React from 'react';
import { FiChevronLeft } from 'react-icons/fi';
import Link from 'next/link';
import { Controller, useForm } from 'react-hook-form';
import { api } from '../services/api';

export default function Settings() {
  const { register, handleSubmit, control } = useForm();

  const onSubmit = async (form: any) => {
    try {
      console.log(form)
      await api.put('api/update-user', form);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.headerWrapper}>
        <Link href="/">
          <a><FiChevronLeft size={24} /></a>
        </Link>
        <h1>Cadastro</h1>
      </header>
      <div className={styles.content}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.fieldControl}>
            <label htmlFor="isAdmin">Administrador</label>
            <Controller 
              name="isAdmin"
              control={control}
              render={({ field }) => (
                <input id="isAdmin" type="checkbox" {...field} />
              )}
            />
          </div>

          <select
            {...register('category')}
          >
            <option value="30">Branca</option>
            <option value="35">Azul</option>
            <option value="40">Roxa</option>
            <option value="45">Marrom</option>
            <option value="50">Preta</option>
            <option value="60">Coral</option>
          </select>

          <button className={styles.saveButton}>
            Salvar
          </button>
        </form>
      </div>
    </div>
  );
}