import { supabase } from "../supabase";

async function downloadImage(
  bucket: string,
  path: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(path);

    if (error) {
      throw error;
    }

    return await new Promise<string | null>((resolve, reject) => {
      const fr = new FileReader();
      fr.readAsDataURL(data);
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = () => reject("Failed to read file as Data URL");
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log("Error downloading image: ", error.message);
    }
    return null;
  }
}

export default downloadImage;
